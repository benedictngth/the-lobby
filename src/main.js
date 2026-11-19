import {
  createParty,
  joinParty,
  updatePartyLifecycle,
  updateStatus,
  validatePartyInput,
} from './domain.js';
import { loadState, resetState, saveState } from './storage.js';
import {
  GUIDED_STEPS,
  renderAreaLobby,
  renderDemoStart,
  renderGuidedPrompt,
  renderPartyDetails,
  renderPartySetup,
} from './views.js';

const root = document.querySelector('#app');

const loaded = loadState();
let state = loaded.state;
let warning = loaded.warning;
let notice = '';

// Screen state is in memory only; the domain data is what persists.
const ui = { screen: 'demo-start', mode: 'free', activePartyId: null, guidedStep: 0 };

const status = document.createElement('p');
status.className = 'app-status';
status.setAttribute('role', 'status');

const FIELDS = {
  areaId: 'setup-area',
  name: 'setup-name',
  place: 'setup-place',
  date: 'setup-date',
  time: 'setup-time',
};
const FIELD_BY_CONTROL = {
  area: 'areaId',
  name: 'name',
  place: 'place',
  date: 'date',
  time: 'time',
};
const FIELD_ORDER = ['areaId', 'name', 'place', 'date', 'time'];
const dirtyFields = new Set();

function render() {
  let fragment;
  if (ui.screen === 'area-lobby') fragment = renderAreaLobby(state, ui);
  else if (ui.screen === 'party-setup') fragment = renderPartySetup(state, ui);
  else if (ui.screen === 'party-details') fragment = renderPartyDetails(state, ui.activePartyId, ui);
  else fragment = renderDemoStart();

  // Kept in normal reading order: prompt follows the view heading, no overlay or focus trap.
  const guided = renderGuidedPrompt(ui);
  const heading = fragment.querySelector('h1');
  if (heading) heading.after(guided);
  else fragment.append(guided);

  root.replaceChildren(fragment, status);

  const message = warning || notice;
  if (status.textContent !== message) status.textContent = message;
  status.hidden = !message;
}

// Guided progress is in memory only; an action or the prompt's skip control advances one step.
function advanceGuided(step) {
  if (ui.mode !== 'guided' || ui.guidedStep !== step) return;
  ui.guidedStep += 1;
  if (ui.guidedStep === GUIDED_STEPS.length) {
    notice = notice ? `Guided walkthrough complete. ${notice}` : 'Guided walkthrough complete.';
  }
}

// Every state mutation goes through persist so the session survives a refresh.
function persist(nextState) {
  state = nextState;
  warning = saveState(state).warning;
  return state;
}

function lifecycleNotice(previous, next) {
  const ended = next.parties.filter((party) => {
    const before = previous.parties.find((item) => item.id === party.id);
    return before?.status === 'Open' && party.status === 'Ended';
  });

  if (ended.length === 1) return `Party "${ended[0].name}" has ended.`;
  if (ended.length > 1) return `${ended.length} parties have ended.`;
  return '';
}

// Runs the lifecycle rules now and reports the announcement text, if anything changed.
function advanceLifecycle() {
  const next = updatePartyLifecycle(state);
  if (next === state) return '';
  const message = lifecycleNotice(state, next);
  persist(next);
  return message;
}

function refreshLifecycle() {
  const message = advanceLifecycle();
  if (!message) return;
  notice = message;
  // A re-render mid-setup would wipe unsaved form values; the notice waits for the next render.
  if (ui.screen === 'party-setup') return;
  render();
}

function readSetupValues(form) {
  return {
    areaId: form.elements.namedItem('area').value,
    name: form.elements.namedItem('name').value,
    place: form.elements.namedItem('place').value,
    date: form.elements.namedItem('date').value,
    time: form.elements.namedItem('time').value,
  };
}

function setFieldError(form, field, message) {
  const control = form.querySelector(`#${FIELDS[field]}`);
  const error = form.querySelector(`#${FIELDS[field]}-error`);

  error.textContent = message;
  if (!message) {
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
    return;
  }

  control.setAttribute('aria-invalid', 'true');
  control.setAttribute('aria-describedby', error.id);
}

root.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'explore' || action === 'guided') {
    notice = '';
    ui.mode = action === 'guided' ? 'guided' : 'free';
    ui.guidedStep = 0;
    ui.screen = 'area-lobby';
    render();
  } else if (action === 'guided-next') {
    advanceGuided(ui.guidedStep);
    render();
    root.querySelector('.guided-prompt')?.focus();
  } else if (action === 'reset-demo') {
    notice = 'Demo reset: sample data restored.';
    persist(resetState().state);
    ui.mode = 'free';
    ui.screen = 'demo-start';
    ui.activePartyId = null;
    ui.guidedStep = 0;
    render();
  } else if (action === 'start-party') {
    notice = '';
    dirtyFields.clear();
    ui.screen = 'party-setup';
    render();
  } else if (action === 'open-party') {
    notice = '';
    ui.activePartyId = event.target.closest('[data-party-id]')?.dataset.partyId ?? null;
    ui.screen = 'party-details';
    render();
    root.querySelector('h1')?.focus();
  } else if (action === 'join-party') {
    const party = state.parties.find((item) => item.id === ui.activePartyId);
    const { state: nextState, result } = joinParty(
      state,
      ui.activePartyId,
      state.currentResidentId,
    );

    if (result === 'joined') {
      persist(nextState);
      notice = `You joined "${party.name}".`;
    } else if (result === 'already-joined') {
      notice = 'You are already attending this party.';
    } else if (result === 'wrong-area') {
      notice = "This party is outside your area, so you can't join it.";
    } else {
      notice = 'This party has ended.';
    }

    advanceLifecycle();
    if (result === 'joined') advanceGuided(2);
    render();
    root.querySelector('h1')?.focus();
  } else if (action === 'set-status') {
    const value = event.target.closest('[data-status]')?.dataset.status;
    persist(updateStatus(state, ui.activePartyId, state.currentResidentId, value));
    const ended = advanceLifecycle();
    notice = `Status set to ${value}.${ended ? ` ${ended}` : ''}`;
    advanceGuided(4);
    const party = state.parties.find((item) => item.id === ui.activePartyId);
    if (party?.status === 'Ended') advanceGuided(5);
    render();
    root.querySelector('h1')?.focus();
  } else if (action === 'back-to-lobby') {
    notice = '';
    ui.activePartyId = null;
    ui.screen = 'area-lobby';
    render();
    root.querySelector('h1')?.focus();
  }
});

root.addEventListener('change', (event) => {
  const action = event.target.dataset.action;

  if (action === 'filter-area') {
    state = { ...state, selectedAreaId: event.target.value };
    render();
    root.querySelector('#area-select')?.focus();
  } else if (action === 'switch-role') {
    const resident = state.residents.find((item) => item.id === event.target.value);
    persist({ ...state, currentResidentId: event.target.value });
    notice = `Demo role: now acting as ${resident?.name ?? 'the selected resident'}.`;
    advanceGuided(1);
    ui.activePartyId = null;
    ui.screen = 'area-lobby';
    render();
    root.querySelector('#role-select')?.focus();
  }
});

root.addEventListener('input', (event) => {
  const form = event.target.closest('form[data-form="party-setup"]');
  const field = FIELD_BY_CONTROL[event.target.name];
  if (!form || !field) return;

  dirtyFields.add(field);
  // Refresh every field already showing an error: date and time share the "not in the future" rule.
  const shown = FIELD_ORDER.filter(
    (name) => form.querySelector(`#${FIELDS[name]}`).getAttribute('aria-invalid') === 'true',
  );
  if (!shown.length) return;
  const errors = validatePartyInput(readSetupValues(form));
  for (const name of shown) setFieldError(form, name, errors[name] || '');
});

root.addEventListener('focusout', (event) => {
  const form = event.target.closest('form[data-form="party-setup"]');
  const field = FIELD_BY_CONTROL[event.target.name];
  if (!form || !field || !dirtyFields.has(field)) return;

  const errors = validatePartyInput(readSetupValues(form));
  setFieldError(form, field, errors[field] || '');
});

root.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form="party-setup"]');
  if (!form) return;
  event.preventDefault();

  const values = readSetupValues(form);
  const errors = validatePartyInput(values);
  for (const field of FIELD_ORDER) setFieldError(form, field, errors[field] || '');

  const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
  if (firstInvalid) {
    form.querySelector(`#${FIELDS[firstInvalid]}`).focus();
    return;
  }

  const nextState = createParty(state, values);
  persist({ ...nextState, selectedAreaId: values.areaId });
  const areaName = state.areas.find((area) => area.id === values.areaId)?.name ?? 'the area';
  notice = `Party "${values.name.trim()}" created in ${areaName}.`;
  advanceGuided(0);
  ui.screen = 'area-lobby';
  render();
  root.querySelector('h1')?.focus();
});

// Lifecycle runs at startup, when the page becomes visible, and once a minute while open.
const startupLifecycle = advanceLifecycle();
if (startupLifecycle) notice = startupLifecycle;

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshLifecycle();
});
setInterval(refreshLifecycle, 60_000);

render();
