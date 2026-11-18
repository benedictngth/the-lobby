function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function actionButton(action, text) {
  const button = el('button', null, text);
  button.type = 'button';
  button.dataset.action = action;
  return button;
}

function labelledField(id, labelText, control) {
  const wrapper = el('div', 'field');
  const label = el('label', null, labelText);
  label.htmlFor = id;
  control.id = id;
  // The empty slot reserves its line so revealing an error cannot move the controls.
  const error = el('p', 'field-error');
  error.id = `${id}-error`;
  wrapper.append(label, control, error);
  return wrapper;
}

function selectArea(state, id, action) {
  const select = el('select');
  select.id = id;
  select.name = 'area';
  select.required = true;
  if (action) select.dataset.action = action;

  const selectedId = state.selectedAreaId ?? state.areas[0]?.id;
  for (const area of state.areas) {
    const option = el('option', null, area.name);
    option.value = area.id;
    option.selected = area.id === selectedId;
    select.append(option);
  }
  return select;
}

// Keeps the stored datetime-local wall clock as text; never route it through UTC.
function formatWallClock(value) {
  const text = String(value ?? '');
  const [date, time] = text.split('T');
  return time ? `${date} at ${time}` : text;
}

function appendDetail(list, term, description) {
  list.append(el('dt', null, term), el('dd', null, description));
}

function renderPartyCard(state, party, areaName) {
  const article = el('article', 'party-card');
  const titleId = `party-${party.id}-title`;
  article.setAttribute('aria-labelledby', titleId);

  const title = el('h2', null, party.name);
  title.id = titleId;

  const details = el('dl', 'party-details');
  appendDetail(details, 'Area', areaName);
  appendDetail(details, 'Place', party.place);
  appendDetail(details, 'Time', formatWallClock(party.startsAt));
  appendDetail(details, 'Status', party.status);
  appendDetail(
    details,
    'Attendees',
    `${party.attendees.length} ${party.attendees.length === 1 ? 'attendee' : 'attendees'}`,
  );

  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const estimate = Number.isFinite(resident?.etaMinutes)
    ? `Estimate: ${resident.etaMinutes} min commute`
    : 'Estimate unavailable';

  const open = actionButton('open-party', 'View details');
  open.dataset.partyId = party.id;

  article.append(title, details, el('p', 'party-estimate', estimate), open);
  return article;
}

export const GUIDED_STEPS = [
  'Start a party: choose an area, name, place, and future time, then create it.',
  'Switch the demo role to Li to act as another resident.',
  'Open the party you created and join it.',
  'Check persistence: the party and your join are saved in this browser, so they survive a refresh.',
  'From the party page, set your status to On the way.',
  'Complete the party: mark yourself and the host Here.',
];

export function renderGuidedPrompt(ui) {
  const fragment = document.createDocumentFragment();
  if (ui.mode !== 'guided') return fragment;

  const section = el('section', 'guided-prompt');
  section.setAttribute('aria-label', 'Guided walkthrough');
  section.tabIndex = -1;

  if (ui.guidedStep >= GUIDED_STEPS.length) {
    section.append(
      el('h2', null, 'Quick Pairing walkthrough complete'),
      el('p', null, 'Explore freely or reset the sample data to run the demo again.'),
    );
    fragment.append(section);
    return fragment;
  }

  section.append(
    el('h2', null, `Step ${ui.guidedStep + 1} of ${GUIDED_STEPS.length}`),
    el('p', null, GUIDED_STEPS[ui.guidedStep]),
    actionButton('guided-next', 'Skip this step'),
  );
  fragment.append(section);
  return fragment;
}

export function renderDemoStart() {
  const fragment = document.createDocumentFragment();
  fragment.append(
    el('h1', null, 'The Lobby'),
    el(
      'p',
      null,
      'Quick Pairing demo: start a meetup in your area, or explore at your own pace.',
    ),
  );

  const actions = el('div', 'demo-start-actions');
  actions.append(actionButton('guided', 'Guided walkthrough'), actionButton('explore', 'Explore freely'));
  fragment.append(actions);
  return fragment;
}

export function renderAreaLobby(state, ui) {
  const fragment = document.createDocumentFragment();
  const heading = el('h1', null, 'Area lobby');
  heading.tabIndex = -1;
  fragment.append(heading);

  const selectedArea =
    state.areas.find((area) => area.id === state.selectedAreaId) ?? state.areas[0];
  const areaId = selectedArea?.id ?? '';
  const areaName = selectedArea?.name ?? 'Unknown area';

  const controls = el('div', 'area-controls');
  const areaLabel = el('label', null, 'Area');
  areaLabel.htmlFor = 'area-select';
  const areaSelect = selectArea(state, 'area-select', 'filter-area');
  controls.append(areaLabel, areaSelect);

  // Demo-only control: switching who you are must not touch the party data.
  const demoControls = el('div', 'demo-controls');
  const roleLabel = el('label', null, 'Demo role');
  roleLabel.htmlFor = 'role-select';
  const roleSelect = el('select');
  roleSelect.id = 'role-select';
  roleSelect.name = 'role';
  roleSelect.dataset.action = 'switch-role';
  roleSelect.setAttribute('aria-describedby', 'role-hint');
  for (const resident of state.residents) {
    const option = el('option', null, resident.name);
    option.value = resident.id;
    option.selected = resident.id === state.currentResidentId;
    roleSelect.append(option);
  }
  const roleHint = el(
    'p',
    'demo-hint',
    'Demo control: switches which resident you are on this device. Party data does not change.',
  );
  roleHint.id = 'role-hint';

  const reset = actionButton('reset-demo', 'Reset sample data');
  reset.setAttribute('aria-describedby', 'reset-hint');
  const resetHint = el(
    'p',
    'demo-hint',
    'Demo control: restores the original sample parties and roles.',
  );
  resetHint.id = 'reset-hint';

  demoControls.append(roleLabel, roleSelect, roleHint, reset, resetHint);

  const parties = state.parties.filter(
    (party) => party.areaId === areaId && party.status === 'Open',
  );

  const list = el('section', 'party-list');
  list.setAttribute('aria-label', `Open parties in ${areaName}`);
  if (parties.length === 0) {
    list.append(el('p', 'empty-state', 'No open parties in this area yet.'));
  } else {
    for (const party of parties) list.append(renderPartyCard(state, party, areaName));
  }

  fragment.append(controls, demoControls, actionButton('start-party', 'Start a Party'), list);
  return fragment;
}

export function renderPartySetup(state, ui) {
  const fragment = document.createDocumentFragment();
  const heading = el('h1', null, 'Start a party');
  heading.id = 'party-setup-heading';
  fragment.append(
    heading,
    el('p', null, 'Choose where and when to meet. Times use your device time zone.'),
  );

  const form = el('form', 'party-setup');
  form.dataset.form = 'party-setup';
  form.setAttribute('aria-labelledby', heading.id);

  const nameInput = el('input');
  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.required = true;
  nameInput.maxLength = 60;
  nameInput.autocomplete = 'off';

  const placeInput = el('input');
  placeInput.type = 'text';
  placeInput.name = 'place';
  placeInput.required = true;
  placeInput.maxLength = 80;
  placeInput.autocomplete = 'off';

  const timeInput = el('input');
  timeInput.type = 'datetime-local';
  timeInput.name = 'startsAt';
  timeInput.required = true;

  form.append(
    labelledField('setup-area', 'Area', selectArea(state, 'setup-area')),
    labelledField('setup-name', 'Party name', nameInput),
    labelledField('setup-place', 'Place to meet', placeInput),
    labelledField('setup-starts-at', 'Meetup time', timeInput),
  );

  const actions = el('div', 'form-actions');
  const submit = el('button', null, 'Create party');
  submit.type = 'submit';
  actions.append(submit, actionButton('back-to-lobby', 'Back to lobby'));
  form.append(actions);

  fragment.append(form);
  return fragment;
}

export function renderPartyDetails(state, partyId, ui) {
  const fragment = document.createDocumentFragment();
  const party = state.parties.find((item) => item.id === partyId);
  const heading = el('h1', null, party ? party.name : 'Party unavailable');
  heading.tabIndex = -1;
  fragment.append(heading);

  if (!party) {
    fragment.append(
      el('p', null, 'This party is no longer available.'),
      actionButton('back-to-lobby', 'Back to lobby'),
    );
    return fragment;
  }

  const areaName = state.areas.find((area) => area.id === party.areaId)?.name ?? 'Unknown area';
  const host = state.residents.find((resident) => resident.id === party.hostId);
  const resident = state.residents.find((item) => item.id === state.currentResidentId);
  const attendee = party.attendees.find((item) => item.residentId === state.currentResidentId);

  const details = el('dl', 'party-details');
  appendDetail(details, 'Area', areaName);
  appendDetail(details, 'Place', party.place);
  appendDetail(details, 'Time', formatWallClock(party.startsAt));
  appendDetail(details, 'Status', party.status);
  appendDetail(details, 'Host', host?.name ?? 'Unknown resident');
  fragment.append(details);

  if (party.status === 'Ended') {
    fragment.append(el('p', 'party-ended', 'This party has ended.'));
  } else if (attendee) {
    fragment.append(el('p', null, "You're attending this party."));
  } else if (!resident || resident.areaId !== party.areaId) {
    fragment.append(
      el(
        'p',
        'party-outside-area',
        `This party is in ${areaName}, outside your area, so you can't join it.`,
      ),
    );
  } else {
    const estimate = Number.isFinite(resident.etaMinutes)
      ? `Estimate: ${resident.etaMinutes} min commute from ${areaName}`
      : 'Estimate unavailable';
    fragment.append(el('p', 'party-estimate', estimate));

    const join = actionButton('join-party', 'Join party');
    join.dataset.partyId = party.id;
    fragment.append(join);
  }

  if (party.status === 'Open' && attendee) {
    const controls = el('div', 'status-controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Your status');
    controls.append(el('p', null, 'Your status'));
    for (const value of ['In', 'On the way', 'Here']) {
      const button = actionButton('set-status', value);
      button.dataset.status = value;
      controls.append(button);
    }
    fragment.append(controls);
  }

  const list = el('ul', 'attendee-list');
  list.setAttribute('aria-label', 'Attendees');
  for (const item of party.attendees) {
    const name = state.residents.find((entry) => entry.id === item.residentId)?.name ?? 'Unknown resident';
    // The ETA only exists while a resident is On the way, and stays readable in text.
    const eta =
      item.status === 'On the way' && Number.isFinite(item.etaMinutes)
        ? ` — ETA ${item.etaMinutes} min`
        : '';
    list.append(el('li', null, `${name} — ${item.status}${eta}`));
  }

  fragment.append(el('h2', null, 'Attendees'), list, actionButton('back-to-lobby', 'Back to lobby'));
  return fragment;
}
