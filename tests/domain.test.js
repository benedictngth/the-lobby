import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/data.js';
import {
  validatePartyInput,
  createParty,
  joinParty,
  updateStatus,
  updatePartyLifecycle,
} from '../src/domain.js';

const NOW = new Date(2026, 10, 17, 18, 0, 0).getTime();
const MEETUP_DATE = '2026-11-17';
const MEETUP_TIME = '19:30';
const STARTS_AT = '2026-11-17T19:30';

function inputFor(state, overrides = {}) {
  return {
    areaId: state.selectedAreaId,
    name: 'Study session',
    place: 'Block lounge',
    date: MEETUP_DATE,
    time: MEETUP_TIME,
    ...overrides,
  };
}

function partyIn(state, partyId) {
  return state.parties.find((party) => party.id === partyId);
}

function attendeeIn(state, partyId, residentId) {
  return partyIn(state, partyId).attendees.find((attendee) => attendee.residentId === residentId);
}

function guestOf(state, party) {
  return state.residents.find(
    (resident) => resident.id !== party.hostId && resident.areaId === party.areaId,
  );
}

test('validation reports one message per invalid field', () => {
  const empty = validatePartyInput({}, NOW);
  assert.deepEqual(Object.keys(empty).sort(), ['areaId', 'date', 'name', 'place', 'time']);
  for (const message of Object.values(empty)) {
    assert.equal(typeof message, 'string');
    assert.ok(message.length > 0);
  }

  const seed = createInitialState();
  const valid = inputFor(seed);

  const missingDate = validatePartyInput({ ...valid, date: '' }, NOW);
  assert.deepEqual(Object.keys(missingDate), ['date']);

  const missingTime = validatePartyInput({ ...valid, time: '' }, NOW);
  assert.deepEqual(Object.keys(missingTime), ['time']);

  const malformedDate = validatePartyInput({ ...valid, date: '2026-02-30' }, NOW);
  assert.deepEqual(Object.keys(malformedDate), ['date']);

  const malformedTime = validatePartyInput({ ...valid, time: '25:10' }, NOW);
  assert.deepEqual(Object.keys(malformedTime), ['time']);

  const past = validatePartyInput({ ...valid, time: '17:59' }, NOW);
  assert.match(past.time, /future/i);

  const atNow = validatePartyInput({ ...valid, time: '18:00' }, NOW);
  assert.match(atNow.time, /future/i);

  assert.deepEqual(validatePartyInput(valid, NOW), {});
});

test('createParty adds an Open party with its host marked In and keeps existing parties', () => {
  const seed = createInitialState();
  const existing = structuredClone(seed.parties);
  const input = inputFor(seed, { name: '  Study session  ', place: '  Block lounge  ' });

  const next = createParty(seed, input, NOW);

  assert.equal(next.parties.length, seed.parties.length + 1);
  assert.deepEqual(next.parties.slice(0, seed.parties.length), existing);
  assert.deepEqual(seed.parties, existing);

  const party = next.parties.at(-1);
  assert.equal(party.areaId, input.areaId);
  assert.equal(party.name, 'Study session');
  assert.equal(party.place, 'Block lounge');
  assert.equal(party.startsAt, STARTS_AT);
  assert.equal(party.status, 'Open');
  assert.equal(party.hostId, seed.currentResidentId);
  assert.deepEqual(party.attendees, [
    { residentId: seed.currentResidentId, status: 'In' },
  ]);
  assert.equal(new Set(next.parties.map((item) => item.id)).size, next.parties.length);
});

test('joinParty allows one eligible resident and refuses duplicates, other areas, and ended parties', () => {
  const seed = createInitialState();
  const created = createParty(seed, inputFor(seed), NOW);
  const party = created.parties.at(-1);
  const guest = guestOf(seed, party);
  assert.ok(guest);

  const joined = joinParty(created, party.id, guest.id, NOW);
  assert.equal(joined.result, 'joined');
  assert.deepEqual(attendeeIn(joined.state, party.id, guest.id), {
    residentId: guest.id,
    status: 'In',
  });

  const duplicate = joinParty(joined.state, party.id, guest.id, NOW);
  assert.equal(duplicate.result, 'already-joined');
  assert.strictEqual(duplicate.state, joined.state);

  const otherAreaParty = { ...party, id: 'party-other-area', areaId: 'student-union' };
  const otherAreaState = { ...created, parties: [...created.parties, otherAreaParty] };
  const wrongArea = joinParty(otherAreaState, otherAreaParty.id, guest.id, NOW);
  assert.equal(wrongArea.result, 'wrong-area');
  assert.strictEqual(wrongArea.state, otherAreaState);

  const endedParty = { ...party, id: 'party-ended', status: 'Ended' };
  const endedState = { ...created, parties: [...created.parties, endedParty] };
  const ended = joinParty(endedState, endedParty.id, guest.id, NOW);
  assert.equal(ended.result, 'ended');
  assert.strictEqual(ended.state, endedState);

  const expiredParty = { ...party, id: 'party-expired', startsAt: '2026-11-17T17:00' };
  const expiredState = { ...created, parties: [...created.parties, expiredParty] };
  const expired = joinParty(expiredState, expiredParty.id, guest.id, NOW);
  assert.equal(expired.result, 'ended');
  assert.strictEqual(expired.state, expiredState);

  assert.equal(partyIn(created, party.id).attendees.length, 1);
});

test('updateStatus applies In, On the way, and Here, keeping the seeded eta only while On the way', () => {
  const seed = createInitialState();
  const created = createParty(seed, inputFor(seed), NOW);
  const party = created.parties.at(-1);
  const host = seed.residents.find((resident) => resident.id === party.hostId);
  assert.ok(Number.isFinite(host.etaMinutes));

  const onTheWay = updateStatus(created, party.id, party.hostId, 'On the way', NOW);
  assert.deepEqual(attendeeIn(onTheWay, party.id, party.hostId), {
    residentId: party.hostId,
    status: 'On the way',
    etaMinutes: host.etaMinutes,
  });

  const here = updateStatus(onTheWay, party.id, party.hostId, 'Here', NOW);
  assert.deepEqual(attendeeIn(here, party.id, party.hostId), {
    residentId: party.hostId,
    status: 'Here',
  });

  const backToIn = updateStatus(here, party.id, party.hostId, 'In', NOW);
  assert.deepEqual(attendeeIn(backToIn, party.id, party.hostId), {
    residentId: party.hostId,
    status: 'In',
  });

  assert.strictEqual(updateStatus(created, party.id, party.hostId, 'Unknown', NOW), created);
  const guest = guestOf(seed, party);
  assert.strictEqual(updateStatus(created, party.id, guest.id, 'Here', NOW), created);
});

test('a party ends when a guest has joined and every attendee is Here', () => {
  const seed = createInitialState();
  const created = createParty(seed, inputFor(seed), NOW);
  const party = created.parties.at(-1);
  const guest = guestOf(seed, party);

  const joined = joinParty(created, party.id, guest.id, NOW).state;
  const hostHere = updateStatus(joined, party.id, party.hostId, 'Here', NOW);
  assert.equal(partyIn(hostHere, party.id).status, 'Open');

  const allHere = updateStatus(hostHere, party.id, guest.id, 'Here', NOW);
  const ended = updatePartyLifecycle(allHere, NOW);

  assert.equal(partyIn(allHere, party.id).status, 'Open');
  assert.equal(partyIn(ended, party.id).status, 'Ended');
  assert.deepEqual(
    ended.parties.map((item) => item.id),
    allHere.parties.map((item) => item.id),
  );
});

test('an unjoined party ends only after its startsAt, while a joined party stays Open', () => {
  const seed = createInitialState();
  const created = createParty(seed, inputFor(seed), NOW);
  const party = created.parties.at(-1);
  assert.equal(party.attendees.length, 1);

  const before = updatePartyLifecycle(created, new Date(2026, 10, 17, 19, 29).getTime());
  assert.equal(partyIn(before, party.id).status, 'Open');

  const after = updatePartyLifecycle(created, new Date(2026, 10, 17, 19, 31).getTime());
  assert.equal(partyIn(after, party.id).status, 'Ended');
  assert.equal(partyIn(created, party.id).status, 'Open');

  const guest = guestOf(seed, party);
  const joined = joinParty(created, party.id, guest.id, NOW).state;
  const joinedLater = updatePartyLifecycle(joined, new Date(2026, 10, 17, 21, 0).getTime());
  assert.equal(partyIn(joinedLater, party.id).status, 'Open');
});

test('seed data is fresh and independent on every call', () => {
  const first = createInitialState();
  const second = createInitialState();

  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.areas, second.areas);
  assert.notStrictEqual(first.areas[0], second.areas[0]);
  assert.notStrictEqual(first.residents, second.residents);
  assert.notStrictEqual(first.residents[0], second.residents[0]);
  assert.notStrictEqual(first.parties, second.parties);
  assert.notStrictEqual(first.parties[0], second.parties[0]);
  assert.notStrictEqual(first.parties[0].attendees, second.parties[0].attendees);
  assert.notStrictEqual(first.parties[0].attendees[0], second.parties[0].attendees[0]);

  const residence = first.areas.find((area) => area.id === first.selectedAreaId);
  assert.ok(residence);
  assert.match(residence.name, /residence/i);

  const residents = first.residents.filter((resident) => resident.areaId === residence.id);
  assert.equal(residents.length, 2);
  for (const resident of residents) {
    assert.ok(Number.isFinite(resident.etaMinutes));
    assert.ok(resident.etaMinutes > 0);
  }

  const active = first.parties.filter(
    (party) => party.areaId === residence.id && party.status === 'Open',
  );
  assert.ok(active.length >= 1);
  for (const party of active) {
    assert.ok(
      party.attendees.some(
        (attendee) => attendee.residentId === party.hostId && attendee.status === 'In',
      ),
    );
  }

  assert.deepEqual(first.areas.map((area) => area.id), second.areas.map((area) => area.id));
  assert.deepEqual(
    first.residents.map((resident) => resident.id),
    second.residents.map((resident) => resident.id),
  );
  assert.deepEqual(first.parties.map((party) => party.id), second.parties.map((party) => party.id));

  first.areas[0].name = 'Changed area';
  first.residents[0].etaMinutes = 999;
  first.parties[0].status = 'Ended';
  first.parties[0].attendees[0].status = 'Here';

  assert.notEqual(second.areas[0].name, 'Changed area');
  assert.notEqual(second.residents[0].etaMinutes, 999);
  assert.equal(second.parties[0].status, 'Open');
  assert.equal(second.parties[0].attendees[0].status, 'In');
});
