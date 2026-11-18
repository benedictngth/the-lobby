import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Serious and critical findings fail the scan; lesser findings are logged for the manual audit.
async function scanForViolations(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const blocking = violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const logged = violations.filter((violation) => !blocking.includes(violation));

  for (const violation of logged) {
    console.log(
      `[a11y:${label}] ${violation.impact} ${violation.id}: ${violation.help} (${violation.nodes
        .map((node) => node.target.join(' '))
        .join('; ')})`,
    );
  }

  expect(
    blocking.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map((node) => node.target.join(' ')),
    })),
    `${label} has serious or critical axe violations`,
  ).toEqual([]);
}

function localDateTime(offsetMinutes) {
  const date = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (value) => String(value).padStart(2, '0');
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

async function openLobby(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore freely' }).click();
}

async function createPartyThroughUi(page, { areaId, name, place, startsInMinutes = 60 }) {
  await page.getByRole('button', { name: 'Start a Party' }).click();
  await page.getByLabel('Area').selectOption(areaId);
  await page.getByLabel('Party name').fill(name);
  await page.getByLabel('Place to meet').fill(place);
  await page.getByLabel('Meetup time').fill(localDateTime(startsInMinutes));
  await page.getByRole('button', { name: 'Create party' }).click();
}

async function switchDemoRole(page, name) {
  await page.getByLabel('Demo role').selectOption({ label: name });
}

async function openPartyDetails(page, name) {
  await page
    .getByRole('article', { name })
    .getByRole('button', { name: 'View details' })
    .click();
}

test('demoStartOffersGuidedAndFreeModes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guided walkthrough' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explore freely' })).toBeVisible();
});

test('exploreModeShowsAreaParties', async ({ page }) => {
  await openLobby(page);

  await expect(page.getByRole('heading', { level: 1, name: 'Area lobby' })).toBeVisible();
  await expect(page.getByLabel('Area')).toHaveValue('north-block');

  const card = page.getByRole('article', { name: 'Study session' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('North Residence Block');
  await expect(card).toContainText('Block lounge');
  await expect(card).toContainText(/\d{4}-\d{2}-\d{2} at \d{2}:\d{2}/);
  await expect(card).toContainText('Open');
  await expect(card).toContainText('1 attendee');
  await expect(card).toContainText('Estimate: 8 min commute');

  await page.getByLabel('Area').selectOption('student-union');
  await expect(page.getByRole('article', { name: 'Study session' })).toHaveCount(0);
  await expect(page.getByText('No open parties in this area yet.')).toBeVisible();

  await page.getByLabel('Area').selectOption('north-block');
  await expect(page.getByRole('article', { name: 'Study session' })).toBeVisible();

  await page.getByRole('button', { name: 'Start a Party' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Start a party' })).toBeVisible();
});

test('partySetupValidatesAndCreatesParty', async ({ page }) => {
  await openLobby(page);
  await page.getByRole('button', { name: 'Start a Party' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Start a party' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Start a party' })).toBeVisible();

  await expect(page.getByLabel('Area')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Party name')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Place to meet')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Meetup time')).toHaveAttribute('required', '');
  await expect(page.getByLabel('Area').locator('option')).toHaveCount(3);

  const pastTime = localDateTime(-60);
  await page.getByLabel('Area').selectOption('east-library');
  await page.getByLabel('Party name').fill('Library meetup');
  await page.getByLabel('Place to meet').fill('Library steps');
  await page.getByLabel('Meetup time').fill(pastTime);
  await page.getByRole('button', { name: 'Create party' }).click();

  await expect(page.getByText('Choose a meetup time in the future.')).toBeVisible();
  await expect(page.getByLabel('Meetup time')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Meetup time')).toHaveAttribute(
    'aria-describedby',
    'setup-starts-at-error',
  );
  await expect(page.locator('#setup-starts-at-error')).toHaveText(
    'Choose a meetup time in the future.',
  );
  await expect(page.getByLabel('Meetup time')).toBeFocused();
  await expect(page.getByLabel('Area')).toHaveValue('east-library');
  await expect(page.getByLabel('Party name')).toHaveValue('Library meetup');
  await expect(page.getByLabel('Place to meet')).toHaveValue('Library steps');
  await expect(page.getByLabel('Meetup time')).toHaveValue(pastTime);

  await page.getByLabel('Meetup time').fill(localDateTime(60));
  await expect(page.getByText('Choose a meetup time in the future.')).toHaveCount(0);
  await expect(page.getByLabel('Meetup time')).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Create party' }).click();

  const status = page.getByRole('status');
  await expect(status).toContainText('Library meetup');
  await expect(status).toContainText('created');

  const card = page.getByRole('article', { name: 'Library meetup' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('East Library');
  await expect(card).toContainText('Open');
  await expect(card).toContainText('1 attendee');

  const hostStatus = await page.evaluate(() => {
    const saved = JSON.parse(window.localStorage.getItem('the-lobby-demo-v1'));
    const created = saved.parties.find((party) => party.name === 'Library meetup');
    return created.attendees.find((attendee) => attendee.residentId === created.hostId).status;
  });
  expect(hostStatus).toBe('In');
});

test('rendersPartyTextAsText', async ({ page }) => {
  await openLobby(page);
  await createPartyThroughUi(page, {
    areaId: 'student-union',
    name: '<em>Campus Cafe</em>',
    place: 'Campus cafe',
  });

  const card = page.getByRole('article', { name: '<em>Campus Cafe</em>' });
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { level: 2 })).toHaveText('<em>Campus Cafe</em>');
  await expect(page.locator('em')).toHaveCount(0);
});

test('persistsPartyAfterReload', async ({ page }) => {
  await openLobby(page);
  await createPartyThroughUi(page, {
    areaId: 'student-union',
    name: 'Reload proof',
    place: 'Union steps',
  });
  await expect(page.getByRole('article', { name: 'Reload proof' })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Explore freely' }).click();

  await expect(page.getByLabel('Area')).toHaveValue('student-union');
  const card = page.getByRole('article', { name: 'Reload proof' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Open');
  await expect(card).toContainText('Union steps');

  await page.getByLabel('Area').selectOption('north-block');
  await expect(page.getByRole('article', { name: 'Reload proof' })).toHaveCount(0);
});

test('showsPersistenceWarningWhenStorageFails', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage blocked for the test');
      },
    });
  });

  await page.goto('/');

  const status = page.getByRole('status');
  await expect(status).toBeVisible();
  await expect(status).toContainText('Storage is unavailable in this browser');
  await expect(status).toContainText('refresh');

  await page.getByRole('button', { name: 'Explore freely' }).click();
  await expect(page.getByRole('status')).toContainText('Storage is unavailable in this browser');
});

test('residentCanJoinAndSeeEta', async ({ page }) => {
  await openLobby(page);
  await switchDemoRole(page, 'Li');

  await expect(page.getByLabel('Demo role')).toHaveValue('resident-li');
  const savedResident = await page.evaluate(
    () => JSON.parse(window.localStorage.getItem('the-lobby-demo-v1')).currentResidentId,
  );
  expect(savedResident).toBe('resident-li');

  await openPartyDetails(page, 'Study session');
  await expect(page.getByRole('heading', { level: 1, name: 'Study session' })).toBeVisible();
  await expect(
    page.getByText('Estimate: 12 min commute from North Residence Block'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Join party' }).click();
  await expect(page.getByRole('status')).toContainText('You joined');

  const attendees = page.getByRole('list', { name: 'Attendees' });
  await expect(attendees.getByRole('listitem')).toHaveCount(2);
  await expect(attendees).toContainText('Ada');
  await expect(attendees).toContainText('Li');
  await expect(page.getByText("You're attending this party.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join party' })).toHaveCount(0);

  await page
    .getByRole('group', { name: 'Your status' })
    .getByRole('button', { name: 'On the way' })
    .click();
  await expect(page.getByRole('status')).toContainText('Status set to On the way.');

  const liItem = attendees.getByRole('listitem').filter({ hasText: 'Li' });
  await expect(liItem).toContainText('On the way');
  await expect(liItem).toContainText('ETA 12 min');

  const savedAttendee = await page.evaluate(() => {
    const saved = JSON.parse(window.localStorage.getItem('the-lobby-demo-v1'));
    const party = saved.parties.find((item) => item.id === 'party-seed-study');
    return party.attendees.find((item) => item.residentId === 'resident-li');
  });
  expect(savedAttendee).toEqual({
    residentId: 'resident-li',
    status: 'On the way',
    etaMinutes: 12,
  });
});

test('hostCanLeaveAndPartyRemainsJoinable', async ({ page }) => {
  await openLobby(page);
  await createPartyThroughUi(page, {
    areaId: 'north-block',
    name: 'After work',
    place: 'Courtyard',
  });
  await expect(page.getByRole('article', { name: 'After work' })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Explore freely' }).click();
  await switchDemoRole(page, 'Li');

  const card = page.getByRole('article', { name: 'After work' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Open');
  await card.getByRole('button', { name: 'View details' }).click();

  await expect(page.getByRole('button', { name: 'Join party' })).toBeVisible();
  await page.getByRole('button', { name: 'Join party' }).click();
  await expect(page.getByRole('status')).toContainText('You joined "After work".');

  const attendees = page.getByRole('list', { name: 'Attendees' });
  await expect(attendees.getByRole('listitem')).toHaveCount(2);
  await expect(attendees).toContainText('Li');

  const savedParty = await page.evaluate(() => {
    const saved = JSON.parse(window.localStorage.getItem('the-lobby-demo-v1'));
    return saved.parties.find((party) => party.name === 'After work');
  });
  expect(savedParty.status).toBe('Open');
  expect(savedParty.attendees.map((attendee) => attendee.residentId)).toContain('resident-li');
});

test('attendeesCanMarkHereToEndParty', async ({ page }) => {
  await openLobby(page);
  await openPartyDetails(page, 'Study session');
  await page
    .getByRole('group', { name: 'Your status' })
    .getByRole('button', { name: 'Here' })
    .click();
  await expect(page.getByRole('status')).toContainText('Status set to Here.');
  await expect(page.getByText('Ended', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to lobby' }).click();
  await switchDemoRole(page, 'Li');
  await openPartyDetails(page, 'Study session');
  await page.getByRole('button', { name: 'Join party' }).click();
  await page
    .getByRole('group', { name: 'Your status' })
    .getByRole('button', { name: 'Here' })
    .click();

  await expect(page.getByRole('status')).toContainText('Status set to Here.');
  await expect(page.getByRole('status')).toContainText('has ended');
  await expect(page.getByText('This party has ended.')).toBeVisible();
  await expect(page.getByText('Ended', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Your status' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Join party' })).toHaveCount(0);

  const savedStatus = await page.evaluate(() => {
    const saved = JSON.parse(window.localStorage.getItem('the-lobby-demo-v1'));
    return saved.parties.find((party) => party.id === 'party-seed-study').status;
  });
  expect(savedStatus).toBe('Ended');
});

test('duplicateJoinIsBlocked', async ({ page }) => {
  await openLobby(page);
  await openPartyDetails(page, 'Study session');

  await expect(page.getByText("You're attending this party.")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join party' })).toHaveCount(0);
  const attendees = page.getByRole('list', { name: 'Attendees' });
  await expect(attendees.getByRole('listitem')).toHaveCount(1);
  await expect(attendees.getByText(/Ada/)).toBeVisible();

  await page.getByRole('button', { name: 'Back to lobby' }).click();
  await switchDemoRole(page, 'Li');
  await openPartyDetails(page, 'Study session');
  await page.getByRole('button', { name: 'Join party' }).click();
  await expect(page.getByRole('button', { name: 'Join party' })).toHaveCount(0);
  await expect(attendees.getByRole('listitem').filter({ hasText: 'Li' })).toHaveCount(1);
  await expect(page.getByText("You're attending this party.")).toBeVisible();

  const liEntries = await page.evaluate(() => {
    const saved = JSON.parse(window.localStorage.getItem('the-lobby-demo-v1'));
    const party = saved.parties.find((item) => item.id === 'party-seed-study');
    return party.attendees.filter((attendee) => attendee.residentId === 'resident-li').length;
  });
  expect(liEntries).toBe(1);
});

test('endedPartyCannotBeJoined', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-17T09:00:00') });
  await openLobby(page);
  await switchDemoRole(page, 'Li');
  await openPartyDetails(page, 'Study session');
  await expect(page.getByRole('button', { name: 'Join party' })).toBeVisible();

  await page.clock.fastForward(91 * 60_000);

  await expect(page.getByText('Ended', { exact: true })).toBeVisible();
  await expect(page.getByText('This party has ended.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join party' })).toHaveCount(0);
});

test('unjoinedPartyExpiresAfterScheduledTime', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-17T09:00:00') });
  await openLobby(page);
  await expect(page.getByRole('article', { name: 'Study session' })).toBeVisible();

  await page.clock.fastForward(91 * 60_000);

  await expect(page.getByRole('article', { name: 'Study session' })).toHaveCount(0);
  await expect(page.getByText('No open parties in this area yet.')).toBeVisible();
});

test('lifecycleRefreshKeepsSetupFormValues', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-17T09:00:00') });
  await openLobby(page);
  await page.getByRole('button', { name: 'Start a Party' }).click();
  await page.getByLabel('Party name').fill('Draft meetup');

  await page.clock.fastForward(91 * 60_000);

  await expect(page.getByRole('heading', { level: 1, name: 'Start a party' })).toBeVisible();
  await expect(page.getByLabel('Party name')).toHaveValue('Draft meetup');
});

test('guidedWalkthroughCanBeSkipped', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Guided walkthrough' }).click();

  const prompt = page.getByRole('region', { name: 'Guided walkthrough' });
  await expect(prompt).toContainText('Step 1 of 6');
  await expect(prompt).toContainText('Start a party');

  for (let step = 2; step <= 6; step += 1) {
    await prompt.getByRole('button', { name: 'Skip this step' }).click();
    await expect(prompt).toContainText(`Step ${step} of 6`);
  }

  await prompt.getByRole('button', { name: 'Skip this step' }).click();
  await expect(prompt).toContainText('walkthrough complete');
  await expect(page.getByRole('status')).toContainText('Guided walkthrough complete');
});

test('freeExploreHasNoPrompts', async ({ page }) => {
  await openLobby(page);

  await expect(page.getByRole('heading', { level: 1, name: 'Area lobby' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Guided walkthrough' })).toHaveCount(0);
  await expect(page.getByText(/Step \d of 6/)).toHaveCount(0);
});

async function measureLayout(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const box = (node) => (node ? node.getBoundingClientRect().toJSON() : null);
    const app = document.querySelector('#app');
    const list = document.querySelector('.party-list');
    const select = document.querySelector('#area-select');
    const start = [...document.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === 'Start a Party',
    );
    const heading = document.querySelector('h1');

    return {
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      viewportWidth: window.innerWidth,
      app: box(app),
      columns: getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length,
      cards: [...document.querySelectorAll('.party-card')].map(box),
      select: box(select),
      start: box(start),
      heading: heading?.textContent,
      order: [heading, select, start, list].map((node) =>
        Math.round(node.getBoundingClientRect().top),
      ),
    };
  });
}

test('layoutReflowsAtNarrowAndWideViewports', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await openLobby(page);

  const narrow = await measureLayout(page);
  expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
  expect(narrow.heading).toBe('Area lobby');
  expect(narrow.columns).toBe(1);
  expect(narrow.cards).toHaveLength(1);
  expect(narrow.app.width / narrow.viewportWidth).toBeGreaterThan(0.87);
  expect(narrow.select.height).toBeGreaterThanOrEqual(24);
  expect(narrow.start.height).toBeGreaterThanOrEqual(24);
  expect(narrow.order[0]).toBeLessThan(narrow.order[1]);
  expect(narrow.order[1]).toBeLessThan(narrow.order[2]);
  expect(narrow.order[2]).toBeLessThan(narrow.order[3]);

  await page.setViewportSize({ width: 1280, height: 900 });
  const wide = await measureLayout(page);
  expect(wide.scrollWidth).toBeLessThanOrEqual(wide.clientWidth);
  expect(wide.heading).toBe('Area lobby');
  expect(wide.columns).toBeGreaterThan(1);
  expect(wide.cards).toHaveLength(1);
  expect(wide.cards[0].width).toBeLessThan(wide.app.width);
  expect(wide.start.height).toBeGreaterThanOrEqual(24);
  expect(wide.order[0]).toBeLessThan(wide.order[1]);
  expect(wide.order[1]).toBeLessThan(wide.order[2]);
  expect(wide.order[2]).toBeLessThan(wide.order[3]);

  // Wide viewports centre the content instead of stretching it edge to edge.
  const leftGap = wide.app.left;
  const rightGap = wide.viewportWidth - (wide.app.left + wide.app.width);
  expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
  expect(leftGap).toBeGreaterThanOrEqual(48);
  expect(narrow.app.width / narrow.viewportWidth).toBeGreaterThan(
    wide.app.width / wide.viewportWidth,
  );
});

test('reducedMotionRemovesTransitions', async ({ page }) => {
  await openLobby(page);

  const transitionDuration = (locator) =>
    locator.evaluate((node) => getComputedStyle(node).transitionDuration);

  const start = page.getByRole('button', { name: 'Start a Party' });
  const card = page.getByRole('article', { name: 'Study session' });

  expect(await transitionDuration(start)).not.toBe('0s');
  expect(await transitionDuration(card)).not.toBe('0s');

  await page.emulateMedia({ reducedMotion: 'reduce' });

  expect(await transitionDuration(start)).toBe('0s');
  expect(await transitionDuration(card)).toBe('0s');
});

test('resetRestoresSeedState', async ({ page }) => {
  await openLobby(page);
  await createPartyThroughUi(page, {
    areaId: 'student-union',
    name: 'Temporary meetup',
    place: 'Union steps',
  });
  await switchDemoRole(page, 'Li');
  await expect(page.getByRole('article', { name: 'Temporary meetup' })).toBeVisible();

  await page.getByRole('button', { name: 'Reset sample data' }).click();

  await expect(page.getByRole('status')).toContainText('sample data restored');
  await expect(page.getByRole('button', { name: 'Explore freely' })).toBeVisible();

  await page.getByRole('button', { name: 'Explore freely' }).click();
  await expect(page.getByLabel('Area')).toHaveValue('north-block');
  await expect(page.getByLabel('Demo role')).toHaveValue('resident-ada');
  await expect(page.getByRole('article', { name: 'Study session' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Temporary meetup' })).toHaveCount(0);

  const saved = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('the-lobby-demo-v1')),
  );
  expect(saved.parties.map((party) => party.name)).toEqual(['Study session']);
  expect(saved.currentResidentId).toBe('resident-ada');
  expect(saved.selectedAreaId).toBe('north-block');
});

test('@a11y demo start', async ({ page }) => {
  await page.goto('/');
  await scanForViolations(page, 'demo start');
});

test('@a11y area lobby', async ({ page }) => {
  await openLobby(page);
  await expect(page.getByRole('heading', { level: 1, name: 'Area lobby' })).toBeVisible();
  await scanForViolations(page, 'area lobby');
});

test('@a11y setup with errors', async ({ page }) => {
  await openLobby(page);
  await page.getByRole('button', { name: 'Start a Party' }).click();
  await page.getByLabel('Area').selectOption('east-library');
  await page.getByLabel('Party name').fill('Library meetup');
  await page.getByLabel('Place to meet').fill('Library steps');
  await page.getByLabel('Meetup time').fill(localDateTime(-60));
  await page.getByRole('button', { name: 'Create party' }).click();
  await expect(page.getByText('Choose a meetup time in the future.')).toBeVisible();
  await scanForViolations(page, 'setup with errors');
});

test('@a11y pre-join party details', async ({ page }) => {
  await openLobby(page);
  await switchDemoRole(page, 'Li');
  await openPartyDetails(page, 'Study session');
  await expect(page.getByRole('button', { name: 'Join party' })).toBeVisible();
  await scanForViolations(page, 'pre-join details');
});

test('@a11y joined party details', async ({ page }) => {
  await openLobby(page);
  await openPartyDetails(page, 'Study session');
  await expect(page.getByRole('group', { name: 'Your status' })).toBeVisible();
  await scanForViolations(page, 'joined details');
});

test('@a11y guided prompt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Guided walkthrough' }).click();
  await expect(page.getByRole('region', { name: 'Guided walkthrough' })).toContainText(
    'Step 1 of 6',
  );
  await scanForViolations(page, 'guided prompt');
});

test('@a11y ended party', async ({ page }) => {
  await openLobby(page);
  await openPartyDetails(page, 'Study session');
  await page
    .getByRole('group', { name: 'Your status' })
    .getByRole('button', { name: 'Here' })
    .click();
  await page.getByRole('button', { name: 'Back to lobby' }).click();
  await switchDemoRole(page, 'Li');
  await openPartyDetails(page, 'Study session');
  await page.getByRole('button', { name: 'Join party' }).click();
  await page
    .getByRole('group', { name: 'Your status' })
    .getByRole('button', { name: 'Here' })
    .click();
  await expect(page.getByText('This party has ended.')).toBeVisible();
  await expect(page.getByText('Ended', { exact: true })).toBeVisible();
  await scanForViolations(page, 'ended party');
});
