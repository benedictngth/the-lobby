import { createInitialState } from './data.js';

const KEY = 'the-lobby-demo-v1';
const UNAVAILABLE =
  'Storage is unavailable in this browser. Parties you create may not survive a refresh.';
const CORRUPT = 'Saved demo data could not be read, so the sample data was reset.';

// The window.localStorage getter itself can throw, so resolve it inside a try.
function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isState(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Array.isArray(value.areas) &&
    Array.isArray(value.residents) &&
    Array.isArray(value.parties) &&
    typeof value.selectedAreaId === 'string' &&
    typeof value.currentResidentId === 'string'
  );
}

function seedResult(persistenceAvailable, warning) {
  return { state: createInitialState(), persistenceAvailable, warning };
}

function discardCorrupt(target) {
  // Best effort: a storage that cannot remove still loads the seed data for this session.
  try {
    target.removeItem(KEY);
  } catch {}
}

export function loadState(storage) {
  const target = resolveStorage(storage);
  if (!target) return seedResult(false, UNAVAILABLE);

  let raw;
  try {
    raw = target.getItem(KEY);
  } catch {
    return seedResult(false, UNAVAILABLE);
  }

  if (raw === null || raw === undefined) return seedResult(true, '');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    discardCorrupt(target);
    return seedResult(true, CORRUPT);
  }

  if (!isState(parsed)) {
    discardCorrupt(target);
    return seedResult(true, CORRUPT);
  }

  return { state: parsed, persistenceAvailable: true, warning: '' };
}

export function saveState(state, storage) {
  const target = resolveStorage(storage);
  if (!target) return { persistenceAvailable: false, warning: UNAVAILABLE };

  try {
    target.setItem(KEY, JSON.stringify(state));
    return { persistenceAvailable: true, warning: '' };
  } catch {
    return { persistenceAvailable: false, warning: UNAVAILABLE };
  }
}

export function resetState(storage) {
  const target = resolveStorage(storage);
  if (!target) return seedResult(false, UNAVAILABLE);

  try {
    target.removeItem(KEY);
    return seedResult(true, '');
  } catch {
    return seedResult(false, UNAVAILABLE);
  }
}
