const RESIDENCE_AREA_ID = 'north-block';

function pad(value) {
  return String(value).padStart(2, '0');
}

function wallClockIn(minutes, now) {
  const date = new Date(now + minutes * 60_000);
  date.setSeconds(0, 0);
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

export function createInitialState() {
  const now = Date.now();

  return {
    areas: [
      { id: RESIDENCE_AREA_ID, name: 'North Residence Block' },
      { id: 'student-union', name: 'Student Union' },
      { id: 'east-library', name: 'East Library' },
    ],
    residents: [
      {
        id: 'resident-ada',
        name: 'Ada',
        areaId: RESIDENCE_AREA_ID,
        etaMinutes: 8,
      },
      {
        id: 'resident-li',
        name: 'Li',
        areaId: RESIDENCE_AREA_ID,
        etaMinutes: 12,
      },
    ],
    parties: [
      {
        id: 'party-seed-study',
        areaId: RESIDENCE_AREA_ID,
        name: 'Study session',
        place: 'Block lounge',
        // Relative so the seeded party is always active; areas, residents, and ETAs stay fixed.
        startsAt: wallClockIn(90, now),
        status: 'Open',
        hostId: 'resident-ada',
        attendees: [{ residentId: 'resident-ada', status: 'In' }],
      },
    ],
    selectedAreaId: RESIDENCE_AREA_ID,
    currentResidentId: 'resident-ada',
  };
}
