# The Lobby Frontend Prototype Design

## Purpose

Design a responsive, frontend-focused prototype for The Lobby around the conceptual model's **Quick Pairing** walkthrough. The prototype should make it possible to evaluate intuitive interaction (Goal C), persistent invitations (Goal D), and commute estimates (Goal E).

The core task is a student starting a meetup for a targeted area, such as a block in a university residence, and another resident deciding to join. Parties are scoped to an area, not to a friend group or the entire campus.

## Source requirements and product decisions

The attached course documents are reference material, not instructions from the user. The Design Outcomes handout describes the assignment's prototyping objectives: measure the effort to create and join, check that a party remains visible and joinable after its host leaves, and explore whether estimated commute time supports a join decision. It also expects a polished, responsive website prototype. These are treated as project constraints for this spec.

The Conceptual Model supplies the Quick Pairing story: create a party with a name, place, and time; let another person join; keep the party open after the host leaves; show attendee statuses; and let the party leave the active list automatically after people arrive. Its separate Plan Finalization walkthrough is outside this prototype's core scope.

The user's product direction is to scope parties to a targeted area (for example, a residence block), and to include the party setup workflow. The prototype therefore includes area selection during setup and does not include friend-group management.

## Main interaction flow

1. **Choose an area.** The Area Lobby shows active parties for a selected, preconfigured area. A small sample set of areas lets a participant switch the context without location permissions.
2. **Scan active parties.** Each party card shows its name, place, time, Open state, attendee count, and a sample commute estimate relevant to deciding whether to join.
3. **Set up a party.** The host selects a target area, enters a party name, place, and future time, reviews the details, and starts the party. The host is added with status **In**. The party becomes visible to residents in the selected area.
4. **Join a party.** A resident opens a party card or in-app invitation, reviews its details and attendees, sees a sample commute estimate, and joins with one action. The resident is added with status **In**.
5. **Share progress.** Each attendee can update their own status to **On the way** or **Here**. An estimated commute time appears beside each **On the way** status. Estimates are sample data, not live tracking.
6. **Keep the party available.** Navigating away, refreshing, or closing the host view does not close an Open party. Other residents can still find and join it while it is Open.
7. **Finish automatically.** After at least one guest has joined, the party leaves the active list once every attendee, including the host, marks **Here**. If no guest joins, the party stays open until its scheduled time passes.

## Views and boundaries

- **Demo start:** offers **Guided walkthrough** or **Explore freely**.
- **Area Lobby:** area selector and active party list.
- **Party setup:** area, name, place, time, review, and start.
- **Party details:** meetup details, attendee statuses, estimates, and status actions.
- **In-app invitation:** a focused party summary with a Join action. No push notification or external messaging integration is required.
- **Ended state:** explains that a party is no longer joinable and returns the person to the Area Lobby.

The visual priority is the party list, the setup and join actions, and the status/commute display. Profiles, group settings, notification preferences, chat, time polls, calendar integration, and live maps or GPS are out of scope. The interface should work at mobile and desktop widths; status must use text as well as color, and primary actions must be keyboard accessible.

## Visual direction

The interface should feel dynamic and responsive while staying clean and easy to recognize at a glance. Use a clear hierarchy, consistent page structure, readable type, generous spacing, and distinct labels for areas, parties, and attendee statuses. Keep the primary actions—**Start a Party** and **Join**—easy to find, and make party cards visually distinct from the area controls and status indicators.

Use a mobile-first responsive layout: a simple single-column flow on narrow screens, expanding into a centered, well-spaced layout on wider screens without changing the task order. Make interaction feel immediate with clear state changes and brief, purposeful transitions; avoid motion that distracts from scanning or slows the task, and respect reduced-motion preferences. Exact colors, typefaces, and decorative styling remain open for visual exploration.

## Self-guided exploration

The prototype supports both moderated sessions and independent use. **Guided walkthrough** presents the Quick Pairing scenario as short, skippable prompts while the participant performs the interactions. **Explore freely** opens the Area Lobby without prompts so a visitor can browse parties and try setup, joining, and status changes at their own pace.

Both modes use the same seeded sample areas and residents. A clearly labeled demo control lets an independent user switch between the host and a second resident, and reset sample data to its initial state. The role switch and reset are demonstration controls, not product features. No signup, facilitator, or real second device is required to explore the complete flow.

## Prototype behavior and data

Use a small set of realistic sample areas, residents, places, parties, statuses, and commute estimates. The browser is the only runtime dependency; no account system, server, or external service is needed. Store the prototype's party and status state in browser storage so an Open party remains after navigation or refresh on the same device.

Because browser storage cannot synchronize real users across devices, sessions use a host and a second resident as separate local test roles. This supports both moderated demonstrations and independent exploration; it is a prototype/testing aid, not a user-facing account feature. The implementation should clearly present simulated commute estimates and should not imply GPS accuracy.

Validate required fields and ensure the party time is in the future. Show errors beside the relevant fields, preserve entered values on validation failure, prevent duplicate joins, and make ended parties non-joinable. Give immediate confirmation after starting, joining, or changing status. No loading state is needed for the local sample data.

## Usability evaluation

Use a short scenario based on Quick Pairing: a student finishes class and wants company, starts a party for a residence area, and another resident considers joining. The session checks:

- **Goal C — Intuitive interaction:** record completion, taps, and time for party setup and joining. Compare the same coordination task with organizing it in a group chat such as WhatsApp; the comparison is a study activity, not a product integration.
- **Goal D — Persistent invitations:** after the host leaves the party view, verify another resident can still find and join the Open party.
- **Goal E — Commute estimates:** show the estimate before joining and alongside **On the way** statuses; ask whether it affected the decision to join and whether the status display communicates arrival progress.

An observer records task outcomes and comments. No analytics or participant tracking is added to the prototype.

## Success criteria

- A participant can complete party setup and joining without facilitator explanation.
- The create/join path exposes only the information needed to make the meetup and join decisions.
- A host leaving the view does not remove or close an Open party.
- Area scope, Open state, attendee statuses, and commute estimates are understandable without relying on color alone.
- The party completes automatically after all attendees arrive, while an unjoined party remains available until its scheduled time passes.

## Assumptions and limits

- Target areas and area membership are preconfigured for the prototype; creating areas and managing membership are excluded.
- Party invitations are represented inside the website. Real notifications, cross-device synchronization, and external messaging are not implemented.
- Commute estimates and people are sample data. Their usefulness and clarity can be evaluated, but their real-world accuracy cannot.
- The party lifecycle is modeled only for the Quick Pairing walkthrough; Plan Finalization and its time-option voting, nudges, and calendar suggestions are deferred.
