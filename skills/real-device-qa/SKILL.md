---
name: Real Device QA
slug: real-device-qa
description: Observe and operate a physical device through its existing mirroring window, keeping device evidence distinct from source and simulator results.
category: Engineering
requires: [computer, cabinet]
license: MIT
version: 1.0.0
default: true
---

Use `device.use` (or `computer.use`) for an already connected physical iPhone's iPhone Mirroring window. This uses StarNet's existing native CUA runtime and its host desktop authorization; placing equipment or attaching this skill never grants permissions. When the tool is unavailable, explain the missing StarNet desktop authority. Do not enable global Full Power or change a team's reach automatically.

1. Define one requested journey and expected visible outcome. Confirm the exact app/build from available evidence. Do not claim simulator or USB connection evidence proves a usable physical app.
2. Use `list_windows` and select the exact observed iPhone Mirroring window. Never launch another browser/runtime or reconnect another chat's device session. Use `describe` to learn each operation's schema.
3. Call `get_window_state` and inspect fresh pixels before every input. iPhone app content may not expose accessibility elements: use screenshot-grounded window-local coordinates only when semantic targeting is unavailable. Do not invent element tokens or use stale screenshots.
4. Perform one requested action, then read a new state to confirm the result. A dispatched input, timeout, generic success or tool availability is not a passed journey. Do not replay failed mutations.
5. If locked, disconnected, busy or requiring OS authentication, stop device input. Record the actual blocker and continue source/build/report preparation. Reuse the human-action wait and explicit Resume; do not poll or repeatedly ask for the same unlock.
6. Record app/build, physical window identity, observation time, steps, before/after evidence and result. Separate source checks, builds, installations, simulator results, physical UI and live server readback. Keep private screen content and credentials out of public reports.

No new simulator or background server is required. For an authorized simulator test use the on-demand resource manager and report simulator evidence explicitly. Native control does not provide arbitrary iOS USB input, bypass locks, grant app install/signing rights, or prove Android/Windows device availability.
