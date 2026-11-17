import { createParty, validatePartyInput } from './domain.js';
import { loadState, saveState } from './storage.js';
import { renderAreaLobby, renderDemoStart, renderPartySetup } from './views.js';

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
  startsAt: 'setup-starts-at',
};
const FIELD_BY_CONTROL = {
  area: 'areaId',
  name: 'name',
  place: 'place',
  startsAt: 'startsAt',
};
const FIELD_ORDER = ['areaId', 'name', 'place', 'startsAt'];
const dirtyFields = new Set();

function render() {
  let fragment;
  if (ui.screen === 'area-lobby') fragment = renderAreaLobby(state, ui);
  else if (ui.screen === 'party-setup') fragment = renderPartySetup(state, ui);
  else fragment = renderDemoStart();

  root.replaceChildren(fragment, status);

  const message = warning || notice;
  if (status.textContent !== message) status.textContent = message;
  status.hidden = !message;
}

// Every state mutation goes through persist so the session survives a refresh.
function persist(nextState) {
  state = nextState;
  warning = saveState(state).warning;
  return state;
}

function readSetupValues(form) {
  return {
    areaId: form.elements.namedItem('area').value,
    name: form.elements.namedItem('name').value,
    place: form.elements.namedItem('place').value,
    startsAt: form.elements.namedItem('startsAt').value,
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
    ui.screen = 'area-lobby';
    render();
  } else if (action === 'start-party') {
    notice = '';
    dirtyFields.clear();
    ui.screen = 'party-setup';
    render();
  } else if (action === 'back-to-lobby') {
    notice = '';
    ui.screen = 'area-lobby';
    render();
  }
});

root.addEventListener('change', (event) => {
  if (event.target.dataset.action !== 'filter-area') return;
  state = { ...state, selectedAreaId: event.target.value };
  render();
  root.querySelector('#area-select')?.focus();
});

root.addEventListener('input', (event) => {
  const form = event.target.closest('form[data-form="party-setup"]');
  const field = FIELD_BY_CONTROL[event.target.name];
  if (!form || !field) return;

  dirtyFields.add(field);
  if (event.target.getAttribute('aria-invalid') !== 'true') return;
  const errors = validatePartyInput(readSetupValues(form));
  setFieldError(form, field, errors[field] || '');
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
  ui.screen = 'area-lobby';
  render();
  root.querySelector('h1')?.focus();
});

render();
