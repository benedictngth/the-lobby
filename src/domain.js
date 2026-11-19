const OPEN = 'Open';
const ENDED = 'Ended';
const ATTENDEE_STATUSES = ['In', 'On the way', 'Here'];
const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Parses the datetime-local wall-clock string in the device's local time.
// Never route this through toISOString()/UTC.
function wallClockToMs(value) {
  if (typeof value !== 'string') return null;
  const match = WALL_CLOCK.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = '0'] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  const roundTrips =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date.getHours() === Number(hour) &&
    date.getMinutes() === Number(minute) &&
    date.getSeconds() === Number(second);

  return roundTrips ? date.getTime() : null;
}

function isWallClockDate(value) {
  return (
    typeof value === 'string' && DATE_ONLY.test(value) && wallClockToMs(`${value}T00:00`) !== null
  );
}

function isWallClockTime(value) {
  return typeof value === 'string' && wallClockToMs(`2000-01-01T${value}`) !== null;
}

export function validatePartyInput(input = {}, now = Date.now()) {
  const errors = {};

  if (!input.areaId) errors.areaId = 'Choose an area.';
  if (!input.name || !input.name.trim()) errors.name = 'Enter a party name.';
  if (!input.place || !input.place.trim()) errors.place = 'Enter a place to meet.';

  if (!input.date) {
    errors.date = 'Enter a meetup date.';
  } else if (!isWallClockDate(input.date)) {
    errors.date = 'Enter a valid meetup date.';
  }

  if (!input.time) {
    errors.time = 'Enter a meetup time.';
  } else if (!isWallClockTime(input.time)) {
    errors.time = 'Enter a valid meetup time.';
  }

  // The two local wall-clock strings compose into the stored format, with no UTC step.
  if (!errors.date && !errors.time && wallClockToMs(`${input.date}T${input.time}`) <= now) {
    errors.time = 'Choose a meetup time in the future.';
  }

  return errors;
}

function nextPartyId(state, now) {
  const base = `party-${now}`;
  let id = base;
  let suffix = 2;
  while (state.parties.some((party) => party.id === id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

export function createParty(state, input, now = Date.now()) {
  const party = {
    id: nextPartyId(state, now),
    areaId: input.areaId,
    name: input.name.trim(),
    place: input.place.trim(),
    startsAt: `${input.date}T${input.time}`,
    status: OPEN,
    hostId: state.currentResidentId,
    attendees: [{ residentId: state.currentResidentId, status: 'In' }],
  };

  return { ...state, parties: [...state.parties, party] };
}

export function joinParty(state, partyId, residentId, now = Date.now()) {
  const party = state.parties.find((item) => item.id === partyId);
  if (!party) return { state, result: 'ended' };

  const startsAt = wallClockToMs(party.startsAt);
  if (party.status !== OPEN || startsAt === null || startsAt <= now) {
    return { state, result: 'ended' };
  }

  const resident = state.residents.find((item) => item.id === residentId);
  if (!resident || resident.areaId !== party.areaId) {
    return { state, result: 'wrong-area' };
  }

  if (party.attendees.some((attendee) => attendee.residentId === residentId)) {
    return { state, result: 'already-joined' };
  }

  const nextParty = {
    ...party,
    attendees: [...party.attendees, { residentId, status: 'In' }],
  };
  const parties = state.parties.map((item) => (item === party ? nextParty : item));

  return { state: { ...state, parties }, result: 'joined' };
}

export function updateStatus(state, partyId, residentId, status, now = Date.now()) {
  if (!ATTENDEE_STATUSES.includes(status)) return state;

  const party = state.parties.find((item) => item.id === partyId);
  if (!party) return state;

  const attendee = party.attendees.find((item) => item.residentId === residentId);
  if (!attendee) return state;

  const nextAttendee = { residentId, status };
  if (status === 'On the way') {
    const resident = state.residents.find((item) => item.id === residentId);
    if (resident && Number.isFinite(resident.etaMinutes)) {
      nextAttendee.etaMinutes = resident.etaMinutes;
    }
  }

  const nextParty = {
    ...party,
    attendees: party.attendees.map((item) => (item === attendee ? nextAttendee : item)),
  };
  const parties = state.parties.map((item) => (item === party ? nextParty : item));

  return { ...state, parties };
}

export function updatePartyLifecycle(state, now = Date.now()) {
  let changed = false;

  const parties = state.parties.map((party) => {
    if (party.status !== OPEN) return party;

    const hasGuest = party.attendees.some((attendee) => attendee.residentId !== party.hostId);
    const allHere = party.attendees.every((attendee) => attendee.status === 'Here');
    const startsAt = wallClockToMs(party.startsAt);
    const expired = startsAt !== null && startsAt <= now;

    if ((hasGuest && allHere) || (!hasGuest && expired)) {
      changed = true;
      return { ...party, status: ENDED };
    }

    return party;
  });

  return changed ? { ...state, parties } : state;
}
