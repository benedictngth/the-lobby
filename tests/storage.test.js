import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/data.js';
import { loadState, saveState, resetState } from '../src/storage.js';

const KEY = 'the-lobby-demo-v1';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    keys: () => [...values.keys()],
  };
}

function failingStorage() {
  const fail = () => {
    throw new Error('storage blocked');
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

test('persistsAndLoadsState', () => {
  const storage = memoryStorage();
  const state = createInitialState();
  state.parties.at(-1).name = 'Saved session';
  state.selectedAreaId = 'student-union';

  const saved = saveState(state, storage);
  assert.equal(saved.persistenceAvailable, true);
  assert.equal(saved.warning, '');
  assert.deepEqual([...storage.keys()], [KEY]);

  const loaded = loadState(storage);
  assert.equal(loaded.persistenceAvailable, true);
  assert.equal(loaded.warning, '');
  assert.deepEqual(loaded.state, state);
});

test('fallsBackForInvalidJson', () => {
  const storage = memoryStorage();
  storage.setItem(KEY, '{not json');

  const loaded = loadState(storage);
  assert.equal(loaded.persistenceAvailable, true);
  assert.ok(loaded.warning.length > 0);
  assert.deepEqual(loaded.state, createInitialState());
  assert.deepEqual([...storage.keys()], []);

  storage.setItem(KEY, JSON.stringify({ areas: [] }));
  const malformed = loadState(storage);
  assert.equal(malformed.persistenceAvailable, true);
  assert.ok(malformed.warning.length > 0);
  assert.deepEqual(malformed.state, createInitialState());
  assert.deepEqual([...storage.keys()], []);
});

test('keepsSeedDataWhenCorruptDataCannotBeRemoved', () => {
  const storage = memoryStorage();
  storage.setItem(KEY, '{not json');
  storage.removeItem = () => {
    throw new Error('storage blocked');
  };

  const loaded = loadState(storage);
  assert.equal(loaded.persistenceAvailable, true);
  assert.ok(loaded.warning.length > 0);
  assert.deepEqual(loaded.state, createInitialState());
});

test('reportsStorageAccessFailure', () => {
  const storage = failingStorage();

  const loaded = loadState(storage);
  assert.equal(loaded.persistenceAvailable, false);
  assert.ok(loaded.warning.length > 0);
  assert.deepEqual(loaded.state, createInitialState());

  const saved = saveState(createInitialState(), storage);
  assert.equal(saved.persistenceAvailable, false);
  assert.ok(saved.warning.length > 0);

  const reset = resetState(storage);
  assert.equal(reset.persistenceAvailable, false);
  assert.ok(reset.warning.length > 0);
  assert.deepEqual(reset.state, createInitialState());
});
