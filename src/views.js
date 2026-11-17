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

  article.append(title, details, el('p', 'party-estimate', estimate));
  return article;
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

export function renderAreaLobby(state) {
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

  fragment.append(controls, actionButton('start-party', 'Start a Party'), list);
  return fragment;
}

export function renderPartySetup(state) {
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
