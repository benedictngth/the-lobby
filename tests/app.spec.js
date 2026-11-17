import { test, expect } from '@playwright/test';

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
