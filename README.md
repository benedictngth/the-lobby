# The Lobby

The Lobby is a frontend-focused prototype for starting and joining meetups scoped to a targeted area, such as a university residence block.

## Prototype focus

- Create a party for an area and join it with a short flow.
- Keep an open party available after its host leaves.
- Show attendee arrival status and sample commute estimates.

The prototype is planned as a responsive website using sample data. Calendar, notification, GPS, and cross-device services are outside the current design scope.

## Design

The approved interaction design and usability goals are in [the frontend prototype spec](docs/superpowers/specs/2026-11-16-the-lobby-frontend-prototype-design.md). The sequenced build steps are in [the implementation plan](docs/superpowers/plans/2026-11-17-the-lobby-frontend-prototype.md). The accessibility target is WCAG 2.2 Level AA.

## Run locally

Requires Node 22.12 or newer (pinned by `@axe-core/playwright` in the lockfile). Then run `npm install` and `npm run dev`.
