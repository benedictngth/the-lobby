# The Lobby Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Keep each task independently reviewable.

**Goal:** Build a responsive, accessible, self-guided and moderator-friendly frontend prototype for area-scoped Quick Pairing meetups.

**Architecture:** Use a small client-only Vite app with plain JavaScript modules, semantic HTML, and CSS. Keep party rules in pure state-transition functions, persistence in one browser-storage module, and rendering/event handling in focused view and app modules. Seeded data and a local role switcher simulate host and resident sessions without an account, server, or external integrations.

**Tech Stack:** HTML, CSS, modern browser JavaScript modules, Vite for local development/build, Node's built-in test runner for domain logic, Playwright for browser flows, and `@axe-core/playwright` for automated accessibility checks.

## Global Constraints

- Build a responsive website for mobile and desktop.
- Parties belong to a preconfigured target area, such as a residence block; do not add friend-group or area-management flows.
- Include both **Guided walkthrough** and **Explore freely** modes using the same sample data.
- Party setup collects target area, name, place, and a future meetup time; the host starts as **In**.
- A resident in the selected area can join an Open party once; provide **In**, **On the way**, and **Here** statuses.
- Display sample commute estimates before joining and beside **On the way** status; never present estimates as live GPS data.
- Keep Open parties in browser storage after navigation and refresh on the same device. No server, account, cross-device synchronization, live notification, calendar, or map integration.
- After at least one guest joins, end a party when all attendees, including the host, are **Here**. If no guest joins, end it after its scheduled time passes.
- Use **WCAG 2.2 Level AA** as the conformance target across all pages and complete flows. Evaluate every applicable Level A and AA criterion with automated and manual checks before claiming conformance.
- Use clear text labels for states, accessible keyboard interactions, logical visible focus, sufficient contrast and target size, and respect reduced-motion preferences.
- Keep the visual hierarchy clean and recognizable; use brief, purposeful interaction feedback. Exact colors and typefaces remain open to visual exploration within the accessibility target.
- Record usability observations without analytics or participant tracking. Compare the create/join task with a group-chat baseline as a study activity, not a product integration.

---

## Planned File Structure

The app source has not been scaffolded; the repository contains the README, approved design spec, and this plan. Add these implementation files:

- `package.json` and `package-lock.json`: Vite scripts and development/test dependencies.
- `.gitignore`: exclude `node_modules/`, `dist/`, and Playwright output.
- `index.html`: document metadata, viewport, and the single application root.
- `src/main.js`: mount the app, connect actions to state transitions, persist updates, and re-render.
- `src/data.js`: deterministic areas, residents, parties, sample ETA values, and initial state.
- `src/domain.js`: party validation, creation, joining, status updates, and lifecycle completion.
- `src/storage.js`: browser-storage load/save/reset and storage-error reporting.
- `src/views.js`: accessible markup for demo start, Area Lobby, setup, party/invitation details, ended state, and guided prompts.
- `src/styles.css`: visual tokens, card/form/status styles, responsive layout, focus states, and reduced-motion behavior.
- `playwright.config.js`: Vite web server and browser test configuration.
- `tests/domain.test.js`: deterministic tests for state transitions and validation using `node:test`.
- `tests/storage.test.js`: deterministic browser-storage tests using an in-memory storage double.
- `tests/app.spec.js`: browser-level flows, persistence, responsive checks, and axe scans.
- `docs/superpowers/checklists/the-lobby-wcag-22-aa.md`: applicable success criteria mapped to a manual/automated check and evidence.
- `README.md`: project entry point linking the approved spec and implementation plan.

### Module Interfaces

Use these exports so the app and tests share the same behavior:

```js
// src/data.js
export function createInitialState();

// src/domain.js
export function validatePartyInput(input, now = Date.now()); // returns { fieldName: message }
export function createParty(state, input, now = Date.now()); // returns next State
export function joinParty(state, partyId, residentId, now = Date.now()); // returns { state, result }
export function updateStatus(state, partyId, residentId, status, now = Date.now()); // returns next State
export function updatePartyLifecycle(state, now = Date.now()); // returns next State

// src/storage.js
export function loadState(storage = window.localStorage); // returns { state, persistenceAvailable, warning }
export function saveState(state, storage = window.localStorage); // returns { persistenceAvailable, warning }
export function resetState(storage = window.localStorage); // returns { state, persistenceAvailable, warning }

// src/views.js
export function renderDemoStart(); // returns HTML string
export function renderAreaLobby(state, ui); // returns HTML string
export function renderPartySetup(state, ui); // returns HTML string
export function renderPartyDetails(state, partyId, ui); // returns HTML string
export function renderGuidedPrompt(ui); // returns HTML string

// src/main.js
export function mountApp(root); // installs delegated events and renders initial screen
```

Represent `State` as `{ areas, residents, parties, selectedAreaId, currentResidentId }`. Represent a party with `id`, `areaId`, `name`, `place`, `startsAt`, `status`, `hostId`, and `attendees`. Each attendee has `residentId`, `status`, and optional `etaMinutes`. `joinParty` returns `result` as `joined`, `already-joined`, `wrong-area`, or `ended`. Persist the domain data under `the-lobby-demo-v1`; keep `screen`, `mode`, `activePartyId`, and `guidedStep` in a separate `ui` object.

## Tasks

### Task 1: Create the client-only app shell

**Files:** Create `package.json`, `package-lock.json`, `.gitignore`, `index.html`, `src/main.js`, `src/styles.css`, `playwright.config.js`, and `tests/app.spec.js`.

- [ ] Add Vite, `@playwright/test`, and `@axe-core/playwright` as development dependencies. Define `dev`, `build`, `test:e2e`, and `test` scripts; initially make `test` run `npm run test:e2e`.
- [ ] Create an HTML document with `lang="en"`, viewport metadata, a page title, and `<main id="app">` as the app root. Load `src/main.js` as an ES module.
- [ ] Configure Playwright to launch Vite on `127.0.0.1:4173` and use that as `baseURL`. Add `demoStartOffersGuidedAndFreeModes` in `tests/app.spec.js`; assert the page heading and both entry actions are visible.
- [ ] Install the Chromium browser for Playwright with `npx playwright install chromium`.
- [ ] Run `npm run test:e2e`. Expected: the new smoke test fails because the app shell does not yet render the entry actions.
- [ ] Render a working demo start screen with **Guided walkthrough** and **Explore freely** buttons from `src/main.js`; use semantic headings and buttons.
- [ ] Run `npm run test:e2e`. Expected: the demo-start smoke test passes in Chromium.
- [ ] Run `npm run build`. Expected: Vite writes a production bundle to `dist/`.
- [ ] Commit as `feat: scaffold The Lobby prototype`.

### Task 2: Define seeded data and party rules

**Files:** Create `src/data.js`, `src/domain.js`, and `tests/domain.test.js`; modify `package.json` to add unit-test scripts.

- [ ] Create `tests/domain.test.js` with the seven domain cases listed below, using `node:test`, `node:assert/strict`, and fixed timestamps. Add `test:unit` as `node --test tests/domain.test.js` and update `test` to run `npm run test:unit && npm run test:e2e`.
- [ ] Run `npm run test:unit`. Expected: tests fail because `src/data.js` and `src/domain.js` do not exist yet.
- [ ] Create deterministic sample areas (including a residence block), two residents in the area, one or more active parties, and fixed commute estimates. `createInitialState()` returns fresh objects so tests cannot mutate a shared seed.
- [ ] Implement `validatePartyInput(input, now)` to return field-keyed messages for missing area/name/place, malformed time, and a meetup time that is not in the future.
- [ ] Implement `createParty(state, input, now)` to add an Open party, add its host with **In** status, and preserve all existing parties.
- [ ] Implement `joinParty(state, partyId, residentId, now)` with outcomes `joined`, `already-joined`, `wrong-area`, or `ended`. Only an eligible resident can join an Open party; duplicate and ended-party attempts do not mutate state.
- [ ] Implement `updateStatus(state, partyId, residentId, status, now)` for **In**, **On the way**, and **Here**. Set the resident's seeded ETA only for **On the way**.
- [ ] Implement `updatePartyLifecycle(state, now)` to end a party when at least one guest joined and every attendee is **Here**, or when an unjoined party's `startsAt` has passed.
- [ ] Run `npm run test:unit` again. Expected: all domain cases pass.
- [ ] Commit as `feat: model area parties and status rules`.

### Task 3: Persist state safely in the browser

**Files:** Create `src/storage.js` and `tests/storage.test.js`; modify `src/main.js` and `package.json`.

- [ ] Add storage unit tests `persistsAndLoadsState`, `fallsBackForInvalidJson`, and `reportsStorageAccessFailure` with an in-memory storage object that implements `getItem`, `setItem`, and `removeItem`.
- [ ] Update `test:unit` to `node --test tests/domain.test.js tests/storage.test.js`.
- [ ] Run `npm run test:unit`. Expected: the storage tests fail because `src/storage.js` does not exist yet.
- [ ] Implement `loadState(storage)` to parse `the-lobby-demo-v1`, validate the stored top-level shape, and fall back to `createInitialState()` for missing or malformed data.
- [ ] Implement `saveState(state, storage)` and `resetState(storage)`. Catch storage access/quota exceptions and return a clear persistence result rather than silently claiming the party was saved.
- [ ] Keep return shapes consistent: `loadState` and `resetState` return `{ state, persistenceAvailable, warning }`; `saveState` returns `{ persistenceAvailable, warning }`. Invalid JSON returns seed data with a recovery warning.
- [ ] Connect app mutations to `saveState`. If storage is unavailable, keep the current session usable and show a visible message that parties may not survive refresh.
- [ ] Render storage warnings as text in a `role="status"` region on the demo start screen; carry the same message into the shared page shell when Task 4 adds the views module.
- [ ] Run `npm run test:unit`. Expected: domain and storage cases pass.
- [ ] Commit as `feat: persist the prototype session locally`.

### Task 4: Build the Area Lobby and party setup flow

**Files:** Create `src/views.js`; modify `src/main.js`, `src/styles.css`, and `tests/app.spec.js`.

- [ ] Add `exploreModeShowsAreaParties` and `partySetupValidatesAndCreatesParty` to `tests/app.spec.js`; assert area scope, required fields, retained input after validation failure, host status **In**, and a visible successful-create message.
- [ ] Run the two tests. Expected: they fail because the Area Lobby and party setup views are not implemented.
- [ ] Wire **Explore freely** from demo start to the Area Lobby; keep guided mode's prompt behavior for Task 6.
- [ ] Render an Area Lobby with a labeled area selector and active party cards. Each card identifies area, name, place, time, Open state, attendee count, and a sample estimate that can inform joining.
- [ ] Render Party Setup with labeled controls for target area, party name, place, and future time, followed by a review/start action.
- [ ] On invalid submit, render each field error adjacent to and programmatically associated with its input; keep entered values intact and focus the first invalid field.
- [ ] Escape user-entered name and place anywhere they are rendered into HTML. Add browser case `rendersPartyTextAsText`, submit `<em>Campus Cafe</em>` as the name, and assert it appears as literal text with no `em` element created.
- [ ] On valid submit, create the party through `domain.js`, persist it, show a confirmation available to assistive technology, and open its details.
- [ ] Add browser test `persistsPartyAfterReload` that creates a party through the UI, reloads the page, and asserts the party remains Open in its area.
- [ ] Add browser test `showsPersistenceWarningWhenStorageFails` using Playwright `addInitScript` to replace the `localStorage` getter with one that throws; assert the visible session-only warning.
- [ ] Run `npm run test:e2e`. Expected: browsing, validation, and creation cases pass.
- [ ] Commit as `feat: add area lobby and party setup`.

### Task 5: Complete join, status, and party lifecycle interactions

**Files:** Modify `src/views.js`, `src/main.js`, `src/domain.js`, `src/storage.js`, and `tests/app.spec.js`.

- [ ] Add `residentCanJoinAndSeeEta`, `hostCanLeaveAndPartyRemainsJoinable`, `attendeesCanMarkHereToEndParty`, `duplicateJoinIsBlocked`, and `endedPartyCannotBeJoined` to `tests/app.spec.js`. For Goal D, create as host, return to Lobby, reload, switch to the resident role, and join the still-Open party.
- [ ] Run the new cases. Expected: they fail because party details, role switching, and status actions are incomplete.
- [ ] Render party details with a pre-join invitation state and one clear **Join** action. Show the joining resident's sample commute estimate before the action.
- [ ] Add an accessible demo role selector for the host and second resident. Switching roles changes `currentResidentId` and returns to the Area Lobby without changing party data.
- [ ] On join, add the resident once, display attendees and their text-labeled statuses, and show ETA beside each **On the way** status. Keep ended parties readable but non-joinable.
- [ ] Connect status controls to `updateStatus`; announce changes through a polite status message. Recompute lifecycle after each update and refresh.
- [ ] Recompute lifecycle at app startup, when the page becomes visible, and once per minute while open so an unjoined party exits the list after its scheduled time passes. Add `unjoinedPartyExpiresAfterScheduledTime` using Playwright's mocked clock.
- [ ] Run `npm run test:unit` and `npm run test:e2e`. Expected: lifecycle rules and all party interactions pass.
- [ ] Commit as `feat: add joining and attendee status flows`.

### Task 6: Add guided and free exploration controls

**Files:** Modify `src/views.js`, `src/main.js`, and `tests/app.spec.js`.

- [ ] Add `guidedWalkthroughCanBeSkipped`, `freeExploreHasNoPrompts`, and `resetRestoresSeedState` to `tests/app.spec.js`.
- [ ] Run the new cases. Expected: they fail because mode handling, guided prompts, and demo controls are incomplete.
- [ ] Make **Explore freely** open the Area Lobby without prompts.
- [ ] Make **Guided walkthrough** show short, skippable Quick Pairing prompts for starting a party, switching to the resident role, joining, checking persistence, updating status, and completing the party. Keep prompts in normal reading and focus order; do not trap focus in an overlay.
- [ ] Add a clearly labeled reset action that restores the initial sample state and confirms completion.
- [ ] Run `npm run test:e2e`. Expected: both modes and local role simulation work without signup or a second device.
- [ ] Commit as `feat: support guided and self-guided demos`.

### Task 7: Apply the responsive visual direction

**Files:** Modify `src/styles.css`, `src/views.js`, `index.html`, and `tests/app.spec.js`.

- [ ] Add a small CSS token set for page width, spacing, type scale, borders, focus ring, and semantic status colors. Choose colors only after checking text and control contrast; do not add remote fonts or decorative assets.
- [ ] Use one-column party and form layouts on narrow screens and a centered, well-spaced layout on wider screens. Keep the task order and primary actions unchanged.
- [ ] Make party cards, area controls, status labels, and primary actions visually distinct. Use text labels alongside state color, visible focus, and brief state transitions.
- [ ] Add `@media (prefers-reduced-motion: reduce)` to remove nonessential transitions. Ensure 320 CSS-pixel reflow and 200% text resize retain all controls and content.
- [ ] Add browser checks `layoutReflowsAtNarrowAndWideViewports` at 320 CSS pixels and 1280 CSS pixels, and `reducedMotionRemovesTransitions` using reduced-motion emulation.
- [ ] Run those checks. Expected: they fail until responsive and reduced-motion styles are applied.
- [ ] Run `npm run test:e2e`. Expected: no horizontal page scrolling at the narrow viewport and both layout checks pass.
- [ ] Commit as `style: make the prototype responsive and clear`.

### Task 8: Audit WCAG 2.2 AA and finish usability verification

**Files:** Create `docs/superpowers/checklists/the-lobby-wcag-22-aa.md`; modify `tests/app.spec.js` and `package.json`.

- [ ] Build the checklist from the W3C WCAG 2.2 Quick Reference. Include every applicable Level A and AA success criterion, a check method (automated or manual), the affected prototype flow, and a result/evidence field. Do not mark a criterion not applicable without recording why.
- [ ] Add `test:a11y` as `playwright test --grep @a11y`. Add axe scans tagged `@a11y` for demo start, Area Lobby, setup with errors, pre-join details, joined details, guided prompt, and ended state. Configure axe with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa` tags; manually check criteria the automated rules do not cover, including WCAG 2.2 target sizing.
- [ ] Run `npm run test:a11y`. Expected: no unresolved serious or critical automated violations; manually review any remaining findings.
- [ ] Complete the checklist manually with keyboard-only use, a representative screen reader, visible/unobscured focus, form errors and announcements, contrast, target size/spacing, 200% text resize, 320 CSS-pixel reflow, orientation, and reduced motion. Record evidence; do not claim full conformance until every applicable criterion passes.
- [ ] Walk through Goal C by recording setup/join completion, taps, and time and comparing with the equivalent group-chat task; Goal D by joining after the host leaves; and Goal E by asking whether the ETA changed the join decision. Record observations outside the app; add no analytics.
- [ ] Run `npm run build`, `npm test`, and `npm run test:a11y`. Expected: production build and automated suites pass, with the manual WCAG checklist completed before describing the prototype as conformant.
- [ ] Commit as `docs: record prototype accessibility and study checks`.

## Spec Coverage Self-Review

- Quick Pairing, area targeting, party setup, one-action joining, statuses, commute estimates, persistence, and lifecycle are covered by Tasks 2–5.
- Guided prompts, free exploration, local role switching, and reset are covered by Task 6.
- Responsive visual direction, clean hierarchy, purposeful motion, and reduced motion are covered by Task 7.
- WCAG 2.2 AA and complete-process verification are covered by Task 8.
- Moderator observations and Goals C, D, and E are covered by Task 8; the WhatsApp comparison remains a study procedure, not an app feature.
- Plan Finalization, account systems, friend-group management, network services, real notifications, calendar, GPS, and analytics remain out of scope.
