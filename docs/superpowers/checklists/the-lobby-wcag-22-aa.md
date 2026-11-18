# The Lobby prototype — WCAG 2.2 Level AA checklist and usability verification

- **Target:** WCAG 2.2 Level AA for every view and complete flow.
- **Built from:** [How to Meet WCAG 2.2 (Quick Reference)](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=a%2Caa).
- **Prototype:** The Lobby demo at branch `the-lobby-frontend`, all seven views: demo start, Area Lobby, party setup (including error state), pre-join party details, joined party details, guided prompt, ended party.
- **Audit date:** 17 November 2026.
- **Environment:** Playwright 1.56 Chromium on macOS; axe-core 4.14.1; viewports 320×720, 720×320, 640×900, 1280×900.
- **Status vocabulary:**
  - **Verified** — reproduced by a committed test or by the measurement procedure recorded in the evidence log.
  - **Verified (programmatic) — requires human verification** — the programmatic state is confirmed, but the criterion is about what a person or assistive technology perceives and that step has not been performed.
  - **N/A** — not applicable, with the reason recorded.
- **Conformance is not claimed.** The automated scans and programmatic checks are green, every applicable Level A/AA criterion is recorded below, and no known failure remains. The human verification steps in [§5](#5-requires-human-verification) and the usability sessions in [§6](#6-usability-verification-goals-c-d-and-e) are still open.

WCAG 2.2 removed 4.1.1 Parsing, so it is not a 2.2 criterion and is not listed. Level AAA criteria are out of scope.

## 1. Applicable Level A and AA success criteria

### Level A success criteria

| Criterion | Level | Method | Prototype flow | Result / evidence |
| --- | --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | Automated + DOM inventory | All views | **Verified.** E1: axe image and control-name rules pass in all scans. E8: no `img`, `svg`, `picture`, `video`, or `audio` elements; every control is native and named by visible text (E2). CSS decoration carries no information. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Source inspection | All views | **N/A.** The prototype has no prerecorded audio or video (E8, E10). |
| 1.2.2 Captions (Prerecorded) | A | Source inspection | All views | **N/A.** No synchronized media exists (E8, E10). |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Source inspection | All views | **N/A.** No prerecorded video exists (E8, E10). |
| 1.3.1 Info and Relationships | A | Automated + accessibility-tree inspection | All views | **Verified.** E1: axe structure rules pass. E2: one `main`, one `h1` per view, `h2` for Attendees and prompts, party cards are `article`s named by their `h2`, details are `dl`/`dt`/`dd`, attendees are a named `ul`, form fields are labelled, “Your status” is a named `group`, status badges are text. |
| 1.3.2 Meaningful Sequence | A | Manual tab/DOM walk | All views | **Verified.** E4: tab order follows DOM order; the committed layout test asserts heading → area select → Start a Party → party list on narrow and wide viewports. No CSS reordering (`order`, absolute positioning) is used. |
| 1.3.3 Sensory Characteristics | A | Manual source review | Setup, lobby, details, prompts | **Verified.** Instructions identify controls by their visible labels (“choose an area, name, place, and future time”); no instruction depends on shape, colour, size, location, orientation, or sound. Status is conveyed in words (“Open”, “On the way”, “Ended”). |
| 1.4.1 Use of Color | A | Manual source review + axe | All views | **Verified.** Status badges carry their status as text; errors add text plus `aria-invalid`; the focus ring supplements native focus behaviour. Colour only reinforces information. |
| 1.4.2 Audio Control | A | Source inspection | All views | **N/A.** No audio is present or autoplayed (E8, E10). |
| 2.1.1 Keyboard | A | Keyboard-only scripted use | All views | **Verified.** E4: every control is a native `button`, `select`, or `input` reachable by Tab and operable with Enter/Space. Scripted keyboard-only run: Enter on “View details” opened the party, Space on “Join party” joined it and the attendee count became 2. |
| 2.1.2 No Keyboard Trap | A | Keyboard traversal | All views | **Verified.** E4: tab walks leave the page after the last control (focus passes to browser chrome); there are no dialogs, overlays, or focus traps. |
| 2.1.4 Character Key Shortcuts | A | Source inspection | All views | **N/A.** No single-character keyboard shortcuts are implemented; only browser-native Tab/Enter/Space behaviour exists. |
| 2.2.1 Timing Adjustable | A | Manual source review | All views | **Verified.** No session, form, or content time limit exists. Meetup-time expiry is domain data that is always shown as text; it does not withdraw content the user is working on. |
| 2.2.2 Pause, Stop, Hide | A | Manual + committed test | All views | **Verified.** E8: no moving, blinking, scrolling, or auto-updating content. The only animation is a 120 ms hover/focus transition, removed under `prefers-reduced-motion: reduce` (committed test `reducedMotionRemovesTransitions`). |
| 2.3.1 Three Flashes or Below Threshold | A | Source inspection | All views | **N/A.** No flashing, strobing, or rapidly changing content exists. |
| 2.4.1 Bypass Blocks | A | Source inspection | All views | **N/A.** Single-page prototype with one `main` landmark and no repeated navigation or banner blocks repeated across pages; there is no block to bypass. |
| 2.4.2 Page Titled | A | Automated + manual | All views | **Verified.** `<title>The Lobby</title>` describes the prototype; each view also has a distinct `h1` (“Area lobby”, “Start a party”, party name). |
| 2.4.3 Focus Order | A | Keyboard traversal | All views | **Verified.** E4: focus follows reading order on every view; no positive `tabindex`; after view changes focus is placed on the new `h1` or restored to the select that caused filtering. |
| 2.4.4 Link Purpose (In Context) | A | Source inspection | All views | **N/A.** The prototype contains no links; all actions are buttons whose text states the action. |
| 2.5.1 Pointer Gestures | A | Source inspection | All views | **Verified.** All actions are single-pointer clicks/taps; no multipoint or path-based gestures. |
| 2.5.2 Pointer Cancellation | A | Source inspection | All views | **Verified.** Activation uses the native click event (up-event); no `pointerdown`/`mousedown` actions. |
| 2.5.3 Label in Name | A | Accessibility-tree inspection | All views | **Verified.** E2: accessible names match visible text exactly (“Guided walkthrough”, “Start a Party”, “View details”, “Join party”, “Back to lobby”, status buttons); no `aria-label` overrides visible wording. |
| 2.5.4 Motion Actuation | A | Source inspection | All views | **N/A.** No device-motion or user-motion input is used. |
| 3.1.1 Language of Page | A | Source inspection | All views | **Verified.** `index.html` sets `<html lang="en">`; no other language is used. |
| 3.2.1 On Focus | A | Manual source + keyboard | All views | **Verified.** Focus only draws the focus ring; context changes happen only on activation (click/Enter/Space) or explicit select change. |
| 3.2.2 On Input | A | Manual source + committed tests | Lobby area filter, demo role | **Verified.** The area select filters the list in place and returns focus to itself; the demo role select updates the role in place, restores focus, and reports the change in the status region. Neither submits a form or opens an unexpected window. |
| 3.2.6 Consistent Help | A | Source inspection | All views | **N/A.** No help, contact, chat, or self-help mechanism is provided anywhere in the prototype, so there is no help mechanism that could appear inconsistently. |
| 3.3.1 Error Identification | A | Committed test + tree inspection | Party setup | **Verified.** E9: an invalid meetup time produces the text “Choose a meetup time in the future.”, `aria-invalid="true"`, `aria-describedby="setup-starts-at-error"`, and focus moves to the first invalid field. E2 confirms the tree exposes `textbox "Meetup time" [invalid]` and the error paragraph. Announcement on focus is covered by the screen-reader step (§5). |
| 3.3.2 Labels or Instructions | A | Automated + tree inspection | Party setup, lobby | **Verified.** E1: every input/select has a visible associated label. The view explains that times use the device time zone; fields expose native `required` constraints and length limits. |
| 3.3.7 Redundant Entry | A | Source inspection | Party setup | **N/A.** The prototype has one form step; no information is requested twice or carried between steps. |
| 4.1.2 Name, Role, Value | A | Automated + tree inspection | All views | **Verified (programmatic) — requires human verification** of screen-reader name/role/state announcements. E1: axe name/role/value rules pass; E2 shows correct roles, names, selected options, `[invalid]`, and the named group/list/article structures. |

### Level AA success criteria

| Criterion | Level | Method | Prototype flow | Result / evidence |
| --- | --- | --- | --- | --- |
| 1.2.4 Captions (Live) | AA | Source inspection | All views | **N/A.** No live audio or video exists. |
| 1.2.5 Audio Description (Prerecorded) | AA | Source inspection | All views | **N/A.** No prerecorded video exists. |
| 1.3.4 Orientation | AA | Scripted viewport check | All views | **Verified.** E6: lobby, setup, and details have no horizontal overflow at 720×320 landscape and 320×720 portrait; no orientation lock, manifest, or orientation media query exists. |
| 1.3.5 Identify Input Purpose | AA | Source inspection | Party setup, demo controls | **N/A.** Fields collect event data (area, party name, place, meetup time), not information about the user from the WCAG Input Purposes list. Free-text fields set `autocomplete="off"` so they are not mistaken for personal-name fields. |
| 1.4.3 Contrast (Minimum) | AA | Token maths (WCAG relative-luminance formula) | All views | **Verified.** E3: every text/background pair is at least 4.5:1. Lowest text ratio is 5.75:1 (`#146c2e` on `#e6f4ea`); primary button 6.39:1; muted text 6.61–7.68:1; error text 6.05:1 on the page background (6.54:1 on white). |
| 1.4.4 Resize Text | AA | Scripted text resize + zoom-equivalent viewport | All views | **Verified (programmatic) — real browser zoom requires human verification.** E7: with root font size at 200% (32 px), text wraps with no clipping and no horizontal overflow at 320 px and 1280 px; at 640 CSS px (the layout width of 1280 px at 200% browser zoom) scroll width equals viewport width. |
| 1.4.5 Images of Text | AA | Source inspection | All views | **N/A.** There are no images; all labels, statuses, and headings are real text (E8). |
| 1.4.10 Reflow | AA | Scripted viewport check + committed test | All views | **Verified.** E6: `scrollWidth == clientWidth` at 320 px for lobby, setup, and details, and at 720×320 landscape for all three; the committed layout test asserts the same at 320 px and 1280 px. E7 also covers 320 px with 200% text. |
| 1.4.11 Non-text Contrast | AA | Token maths | All views | **Verified.** E3: focus ring 6.39:1 on white, 5.91:1 on the page background, and 5.55:1 on the muted demo-control surface; input borders 4.54:1 on white and 4.20:1 on the page background; invalid-field border 6.54:1. All exceed 3:1. |
| 1.4.12 Text Spacing | AA | Scripted style overrides | Lobby, setup, details | **Verified.** E7: with line height 1.5, letter spacing 0.12em, word spacing 0.16em, and paragraph spacing 2em injected, no element is clipped and no horizontal overflow appears in any of the three views. |
| 1.4.13 Content on Hover or Focus | AA | Source inspection | All views | **N/A.** No content appears on hover or focus; hints and errors are permanently visible text, and there are no tooltips or popovers. |
| 2.4.5 Multiple Ways | AA | Source inspection | Prototype | **N/A.** The prototype is one web page with one entry point; there is no set of pages in which a page could be located by another method. |
| 2.4.6 Headings and Labels | AA | Automated + tree inspection | All views | **Verified.** E1: heading/label rules pass. Headings describe purpose (“Area lobby”, “Start a party”, party name, “Attendees”, “Step N of 6”); labels describe each control (“Area”, “Party name”, “Place to meet”, “Meetup time”, “Demo role”). |
| 2.4.7 Focus Visible | AA | Keyboard traversal + computed styles + screenshot | All views | **Verified.** E4: every focused control reports a 3 px solid `rgb(11, 87, 208)` outline (from `:focus-visible`). The native `datetime-local` control keeps the outer ring for its date/time segments and shows Chromium’s native focus box on its internal calendar button (checked in a screenshot at both steps). |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Keyboard traversal + computed layout | All views | **Verified.** E4: every focused element was fully inside the viewport (stronger than “not entirely hidden”) and topmost at its centre point; E8 confirms no `position: fixed` or `sticky` elements exist, so nothing can cover focus. |
| 2.5.7 Dragging Movements | AA | Source inspection | All views | **N/A.** No drag interactions or `draggable` elements exist (E8); all actions are single clicks/taps. |
| 2.5.8 Target Size (Minimum) | AA | Scripted measurement | All views | **Verified (programmatic) — real touch hardware requires human verification.** E5: measured controls are 40 px high (selects), 42 px (buttons, text inputs), and 46 px (datetime control). The coarse-pointer rule raises minimum height to 2.75 rem (44 px); this was inspected in CSS but not measured on a physical touch device. Status badges are non-interactive text. |
| 3.1.2 Language of Parts | AA | Source inspection | All views | **N/A.** All content is English; no passage in another language appears, so no `lang` attribute on a part is needed. |
| 3.2.3 Consistent Navigation | AA | Source inspection | Views | **N/A.** This single-page prototype has no repeated navigation mechanism across separate pages. Within views, recurring actions keep the same label and placement (“Back to lobby” last, “Start a Party” in the lobby). |
| 3.2.4 Consistent Identification | AA | Tree inspection + source | All views | **Verified.** E2: the same functions use the same names everywhere (“View details”, “Back to lobby”, “Join party”, “On the way”, “Here”); no component changes identity between views. |
| 3.3.3 Error Suggestion | AA | Committed test | Party setup | **Verified.** E9: the error states the correction (“Choose a meetup time in the future.”) and the input remains editable with values preserved. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Source inspection | Party setup, reset | **N/A.** There are no legal or financial transactions and no deletion of user data. Party creation is local, reversible via “Reset sample data”, and the user can review and edit every value before submitting. |
| 3.3.8 Accessible Authentication (Minimum) | AA | Source inspection | All views | **N/A.** There is no authentication; the demo role switch is a local simulation and requires no credentials, puzzle, or cognitive test. |
| 4.1.3 Status Messages | AA | Tree inspection + committed tests | Join, status change, party end, storage warning, reset | **Verified (programmatic) — screen-reader announcement requires human verification.** E2: a persistent polite `role="status"` region contains “Status set to Here. Party "Study session" has ended.”; E9 asserts join, status, reset, storage-warning, and party-ended messages. Focus is not moved for these messages. |

## 2. Not-applicable summary

Twenty-two criteria are N/A. Each reason is recorded in the table above and grouped here:

- **No time-based media or audio (1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.4.2):** the prototype contains no audio or video elements and plays no sound.
- **No images of text (1.4.5):** there are no `img`, `svg`, `picture`, or other image elements; all information is text or CSS decoration, and the control-naming requirement of 1.1.1 is met.
- **No flashing or motion-activated input (2.3.1, 2.5.4):** no flashing content and no device-motion or gesture sensor use.
- **No repeated navigation or links (2.4.1, 2.4.4, 2.4.5, 3.2.3):** one web page, one `main`, no links, and no repeated navigation mechanism across pages.
- **No character shortcuts or dragging (2.1.4, 2.5.7):** only native Tab/Enter/Space and single-pointer activation.
- **No help mechanism to place consistently (3.2.6):** there is no help, contact, chat, or self-help control anywhere.
- **No personal-purpose inputs (1.3.5):** fields collect event data, not user information from the WCAG Input Purposes list.
- **No hover/focus content (1.4.13):** hints and errors are permanently visible, with no tooltips or popovers.
- **No multi-step re-entry (3.3.7):** the only form is a single step.
- **No other-language passages (3.1.2):** all content is English.
- **No reversible-damage transaction (3.3.4):** no legal or financial action and no user-data deletion; creation is reversible.
- **No authentication (3.3.8):** the demo role switch is local and credential-free.

## 3. Evidence log

### E1 — Automated axe scans

Command: `npm run test:a11y` (`playwright test --grep @a11y`).

Configuration: `@axe-core/playwright` 4.14.1, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Serious and critical violations fail the test; lesser findings are logged.

| Scan | Rules passed | Violations |
| --- | --- | --- |
| Demo start | 9 | 0 |
| Area Lobby | 19 | 0 |
| Setup with errors | 19 | 0 |
| Pre-join details | 18 | 0 |
| Joined details | 21 | 0 |
| Guided prompt | 19 | 0 |
| Ended party | 21 | 0 |

Result: 7/7 scans pass with zero violations of any impact. No false positive needed documenting, so no rule was suppressed or excluded.

### E2 — Accessibility-tree inspection

One-off Playwright script against the dev server, using `locator.ariaSnapshot()` per view. Key recorded output:

- Demo start: `main` → `heading "The Lobby" [level=1]`, two named buttons.
- Lobby: `combobox "Area"` with selected option, `combobox "Demo role"`, named buttons, `region "Open parties in North Residence Block"` → `article "Study session"` → `heading [level=2]`, `term`/`definition` pairs, named “View details” button.
- Guided: `region "Guided walkthrough"` → `heading "Step 1 of 6" [level=2]`, paragraph, “Skip this step” button.
- Setup error: `form "Start a party"` → labelled `combobox`, `textbox "Party name"`, `textbox "Place to meet"`, `textbox "Meetup time" [invalid]`, error paragraph “Choose a meetup time in the future.”, two buttons.
- Pre-join: heading, `term`/`definition` details, estimate paragraph, “Join party”, `list "Attendees"`, “Back to lobby”.
- Joined: adds `group "Your status"` with “In”, “On the way”, “Here”.
- Ended: status definition “Ended”, “This party has ended.”, attendee list, and `status: Status set to Here. Party "Study session" has ended.`

### E3 — Contrast token maths

Computed with the WCAG 2.2 relative-luminance formula (sRGB, 0.04045 threshold) from the CSS custom properties in `src/styles.css`.

| Pair | Ratio |
| --- | --- |
| `--text` #1b1b1b on `--page-bg` #f7f6f3 | 15.94:1 |
| `--text` on `--surface` #ffffff | 17.22:1 |
| `--text-muted` #55534e on page background | 7.11:1 |
| `--text-muted` on white | 7.68:1 |
| `--text-muted` on `--surface-muted` #f1efe9 | 6.68:1 |
| `--text-muted` on `--surface-hover` #efeee9 | 6.61:1 |
| `--on-action` #ffffff on `--action` #0b57d0 | 6.39:1 |
| `--on-action` on `--action-hover` #0842a0 | 9.14:1 |
| `--danger` #b3261e on white | 6.54:1 |
| Body text on status-message `--surface-hover` #efeee9 | 14.83:1 |
| `--danger` #b3261e on the page background #f7f6f3 | 6.05:1 |
| Open `#146c2e` on `#e6f4ea` | 5.75:1 |
| On the way `#7a4100` on `#fff1d6` | 7.28:1 |
| Here `#0b4f9e` on `#e8f0fe` | 6.98:1 |
| Ended `#4a4844` on `#eeece7` | 7.73:1 |
| Body text on guided-prompt `#eef3fd` | 15.48:1 |
| `--focus` #0b57d0 on white (non-text) | 6.39:1 |
| `--focus` on page background (non-text) | 5.91:1 |
| `--focus` on `--surface-muted` #f1efe9 (non-text) | 5.55:1 |
| `--border-color` #767676 on white (non-text) | 4.54:1 |
| `--border-color` on page background (non-text) | 4.20:1 |

### E4 — Keyboard, focus, and focus visibility

One-off Playwright script: start from the freshly loaded view, press Tab up to 25 times, and for each `document.activeElement` record tag, accessible text, rectangle, computed outline, whether the rectangle is fully inside the viewport, and whether `elementFromPoint` at its centre resolves to the element.

- Lobby at 320 px: Area select (207×40), Demo role select (253×40), Reset sample data (168×42), Start a Party (129×42), View details (121×42), in reading order.
- Lobby at 1280 px, setup (error state), pre-join details, and ended view: same reading order, every focused element fully in viewport.
- Every control: `outline: 3px solid rgb(11, 87, 208)`; centre point topmost.
- Tab from the last control moves focus out of the page (no trap).
- Setup error: focus lands on “Meetup time” after submit; Tabs cycle through the native date/time sub-fields and the internal calendar button before reaching “Create party” and “Back to lobby”. Those internal steps show Chromium’s native focus indicators (outer 3 px ring for the date/time segments, native focus box on the picker button), checked in screenshots.
- Keyboard-only task: Enter on “View details” opened details and focused the `h1`; Space on “Join party” joined and the attendee list grew to 2.

### E5 — Target sizes

One-off Playwright script measuring `getBoundingClientRect()` for every `button`, `input`, `select`, `a[href]`, and `[role="button"]` on each view: lobby at 320 px and 1280 px; setup, pre-join details, and joined details at 1280 px.

| Control | Measured size |
| --- | --- |
| Selects (Area, Demo role) | 40 px high |
| Buttons (all) | 42 px high, ≥ 47 px wide (narrowest “In” is 47×42) |
| Text inputs | 42 px high |
| `datetime-local` input | 46 px high |

The smallest dimension is 40 px, above the 24×24 CSS px minimum. The coarse-pointer media query raises minimum height to 44 px; not exercised on physical hardware.

### E6 — Reflow and orientation

One-off Playwright script reading `document.documentElement.scrollWidth` and `clientWidth`:

- 320×720: lobby 320/320, setup 320/320, details 320/320.
- 720×320 landscape: lobby 720/720, setup 720/720, details 720/720.
- Committed test `layoutReflowsAtNarrowAndWideViewports` additionally asserts no horizontal scroll, one column at 320 px, multiple columns at 1280 px, and content order.

### E7 — Text resize and text spacing

One-off Playwright script:

- Root font size set to 32 px (200% of the 16 px default): lobby at 320 px and 1280 px has no horizontal overflow; controls grow (80 px high; widths adapt from 256 px at the 320 px viewport up to 1111 px at 1280 px) and text wraps instead of clipping.
- 640×900 viewport (layout width of 1280 px at 200% browser zoom): scroll width 640, client width 640.
- Injected WCAG text-spacing overrides (line height 1.5, letter spacing 0.12em, word spacing 0.16em, paragraph spacing 2em) on lobby, setup, and details: no clipped elements, no horizontal overflow.

### E8 — Motion, media, and layout inventory

One-off DOM/script inspection plus committed tests:

- `prefers-reduced-motion: reduce` sets all transitions/animations to none (committed test `reducedMotionRemovesTransitions` verifies computed `transitionDuration === '0s'`).
- No `img`, `svg`, `picture`, `video`, or `audio` elements; no `a[href]`; no `draggable="true"`; no `position: fixed` or `sticky` elements.

### E9 — Behavioral test coverage

`npm test` runs 10 unit tests, 17 end-to-end flow tests, and the 7 `@a11y` scans, covering validation, error association and focus, persistence, storage failure announcement, join/duplicate/area rules, status and ETA display, host departure, party end, guided skipping, reflow, reduced motion, and reset.

### E10 — Source inspection

`index.html` (`lang="en"`, viewport meta, title), `src/views.js` (native controls, text-only status badges, labelled fields, named regions/groups/lists), `src/main.js` (single polite status region, no analytics or storage of personal data), `src/styles.css` (relative units, no orientation lock, reduced-motion block).

## 4. Prototype flows covered by every check

| Flow | Views exercised |
| --- | --- |
| Demo start | Entry screen with guided and free modes |
| Area Lobby | Area filter, party card, demo role, reset |
| Party setup | Empty form, native constraints, app validation error, first-invalid focus |
| Pre-join details | Invitation with estimate and Join action |
| Joined details | Attendee list, status buttons, ETA beside On the way |
| Guided prompt | Inline skippable step, focused on advance |
| Ended party | Ended badge, ended text, no join/status controls, status announcement |

## 5. Requires human verification

These checks were **not** performed. They are the remaining evidence needed before conformance could be claimed.

| Area | Criterion | Human step |
| --- | --- | --- |
| Screen reader | 4.1.2, 4.1.3, 3.3.1 (supplementary spot-check: 1.3.1, 2.4.3, 2.4.6) | With a representative screen reader (for example NVDA with Firefox on Windows, or VoiceOver with Safari on macOS), confirm: the new `h1` is announced after each view change; “Meetup time, invalid, Choose a meetup time in the future” is announced when the error appears or the field is focused; join/status/end messages are announced politely without moving focus; the party card reads as an article with its heading and description list; “Your status, group” and the attendee list are announced with their names; combobox values and selected options are announced. Programmatic evidence is recorded in E2 and E4. |
| Browser zoom | 1.4.4 | At 200% browser zoom in a real browser (not just the scripted text-size and viewport equivalents), confirm no clipping and no loss of content while creating a party and joining one. |
| Touch hardware | 2.5.8 | On a physical touch device, measure or use the smallest controls (status buttons, “Join party”, “Back to lobby”) and confirm comfortable, non-overlapping targets with the coarse-pointer rule active. |
| Forced colours / high contrast | — (risk note) | The palette is authored with explicit colours and no forced-colours block; check Windows High Contrast / `forced-colors: active` if that mode is in scope. This is not a WCAG 2.2 A/AA criterion but is a related platform mode. |
| Usability sessions | Goals C, D, E | Run the procedure in §6 and fill the observation template. No participants have been observed yet. |

## 6. Usability verification (Goals C, D, and E)

### 6.1 Ground rules

- Moderator-run sessions; observations are recorded on paper or in a separate notes file **outside the app**.
- The prototype has **no analytics, telemetry, or participant tracking**; do not add any.
- Use participant codes (P1, P2, …) rather than names. Record device, browser, and assistive technology.
- Read the task script, do not lead with feature explanations, and do not help unless the participant is stuck for more than two minutes or asks to stop.
- The group-chat comparison is a **study activity**, not a product integration: participants perform the same coordination task in a chat app they already use (for example WhatsApp), as a baseline for completion, taps, and time.

### 6.2 Goal C — intuitive setup and joining

**Question:** Can a resident start or join a meetup with fewer steps and less time than arranging the same meetup in a group chat?

**Counterbalanced order:** half the participants do the prototype first, half the chat first.

**Prototype task script:** “You want to meet someone from your building at the block lounge this evening. Using this prototype, set up that meetup and then join it as the other resident.”

Steps the moderator starts timing from the task read and stops at a successful join (or 5 minutes, whichever comes first). Count taps/clicks and activation keys as taps. Record errors and any moderator help.

**Chat baseline task script:** “Now arrange the same meetup in the group chat you normally use: tell the group where and when to meet.”

Record time to send the message, taps, and whether the message contains place and time. Treat the baseline as a coordination message, not as a working RSVP system, and note that difference in analysis.

**Look for:** task completion without help; tap count; elapsed time; points where participants hesitate or ask what to do; whether the estimate and party card are noticed.

| Participant | Order | Prototype completed (Y/N) | Prototype taps | Prototype seconds | Prototype errors/help | Chat completed (Y/N) | Chat taps | Chat seconds | Notes / quotes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |

### 6.3 Goal D — persistent invitation after the host leaves

**Question:** After the host leaves the party view, can another resident still find and join the Open party?

**Automated pre-check (already in the suite):** `hostCanLeaveAndPartyRemainsJoinable` passes. It creates a party as host, reloads, switches to the resident role, finds the still-Open party in the lobby, and joins it as the second attendee. The study below adds human observation of findability and effort.

**Procedure:**

1. Participant acts as the host (default role Ada), creates a named party in the current area, then returns to the Area Lobby.
2. Host leaves the party view and, in the same session, the participant reloads the page or switches to the other demo role (Li). Both simulate the host no longer being present in the view.
3. Participant finds the party in the lobby and joins it.
4. Moderator records whether the party was found, whether joining succeeded, time, taps, and any comment about expecting the invitation to persist.

| Participant | Party name | Host left view (reload / role switch) | Found in lobby (Y/N) | Joined (Y/N) | Taps | Seconds | Quote / observation |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

### 6.4 Goal E — commute estimate and arrival progress

**Question:** Does the commute estimate affect the decision to join, and does the status display communicate arrival progress?

**Automated pre-check (already in the suite):** `residentCanJoinAndSeeEta` passes. It shows “Estimate: 12 min commute from North Residence Block” before joining, then shows “ETA 12 min” beside the “On the way” status after joining. The study below asks whether those values changed behaviour and whether the display communicates progress.

**Procedure:**

1. With the party details open as a non-attendee, ask: “What information are you using to decide whether to join?” (Do not prompt about the estimate first.)
2. If the estimate is not mentioned, ask neutrally: “Did you notice anything about travel time? Did it affect your decision? How?”
3. After joining, ask the participant to show the others their progress. Then ask: “What does the status display tell you about whether people are arriving? What would you expect to see?”
4. Record verbatim answers and whether the participant noticed the pre-join estimate, changed their join decision because of it, understood “On the way — ETA N min”, and could describe what the statuses mean.

| Participant | Noticed pre-join estimate (Y/N) | Affected join decision (Y/N) | How / why (verbatim) | Status display understood (Y/N) | Arrival progress clear (Y/N) | Quote / observation |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

### 6.5 Session header and closing notes (empty template)

| Field | Value |
| --- | --- |
| Date / time |  |
| Moderator |  |
| Participant code |  |
| Device / OS / browser |  |
| Assistive technology used |  |
| Order (prototype first / chat first) |  |
| Consent to observe recorded |  |
| Tasks completed |  |
| Blocking problems |  |
| Surprises or unmet expectations |  |
| Changes suggested for the next prototype round |  |

Store completed forms outside the app. Do not paste participant names or personal details into the prototype or its storage.

## 7. Conclusion

- All 55 applicable WCAG 2.2 Level A and AA criteria are recorded above: 29 verified, 4 verified programmatically with a named human step outstanding (4.1.2, 4.1.3, 1.4.4, 2.5.8), and 22 N/A with reasons.
- No automated serious or critical violation remains, and no violation of any impact was produced by the seven axe scans.
- **Conformance is not claimed** and the prototype is not described as conformant until the §5 human checks and §6 sessions are complete and their evidence is added.
