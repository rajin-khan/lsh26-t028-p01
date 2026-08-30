# P01 review

Review date: 2026-08-30  
Project: KajChole, LSH26-T028 P01  
Goal: maximize the judged result without adding work that does not improve reliability, clarity, or submission readiness.

## Verdict

The four P01 flows are implemented and the valid-input scheduler is sound. The project passes its locked checks and the main browser flows. The largest risks are submission readiness and defensive handling of browser state. Fix the blocking items before recording or submitting. Leave the scheduler policy and visual direction alone unless a later test gives a concrete reason to change them.

## Numbered decisions

### 1. Provide a real KajChole live URL

**Severity: Blocker.**

`README.md` still says `Live URL: pending deployment`, and `evaluation-manifest.json` has an empty `live_url`. The supplied `https://live.hackathon.lofistack.com/` URL opens the LofiStack Hackathon Problem Arena, not this planner. A judge cannot verify P01 from that page.

**Why this matters:** The submission rules require a public URL that loads without setup. The initial screen is checked before deep judging, so this can reduce the submission to non-functional even though the local app works.

**Decision:** Yes, fix before submission. Deploy the current app, open the deployed URL in a private window, test it, then update the README and manifest with the exact URL.

### 2. Use the required 60-second demo limit

**Severity: High.**

The attached Format and Scoring brief says the demo video may be no more than 60 seconds. [docs/DEMO.md](docs/DEMO.md) is titled `Three-minute demo` and its recording flow runs from 0:00 to 3:00.

**Why this matters:** A polished but over-length video fails a stated submission requirement. The first 60 seconds must show the problem, the four MVP flows, and enough proof to judge the result.

**Decision:** Yes, fix the demo script. Compress it to 60 seconds and show the working app, not a long architecture explanation.

### 3. Reconcile the official scoring and deadline sources

**Severity: High, team-lead input required.**

The live [orientation page](https://hackathon.lofistack.com/orientation-page) and [HACKATHON_CONTEXT.md](HACKATHON_CONTEXT.md) use a 30-point Functionality and 15-point Demo and Documentation split. The attached Format and Scoring document uses 25 points for Functionality and 20 for Demo and Documentation. The sources also phrase the 10:00 PM build cutoff and the 11:59 PM submission deadline differently.

**Why this matters:** The correct source changes what the team should prioritize and what the README should claim. The live event site should be treated as authoritative unless the organizers publish a clarification.

**Decision:** Team lead confirms the authoritative rubric and deadline wording. Then make the repository docs and demo plan consistent with that source.

### 4. Complete the submission manifest and contribution evidence

**Severity: High.**

`evaluation-manifest.json` still has an empty `live_url`, pending contribution lines for Saumik Saha Kabbya and Samiyeel Alim Binaaf, and a declaration that says the information is complete while also saying those fields will be replaced. `README.md` also uses `rajin-khan`, while `HACKATHON_CONTEXT.md` identifies the leader as `RajinDashKhan`.

**Why this matters:** The final form requires the public repository URL, exact 40-character judged SHA, and live URL. The repository also needs truthful contribution and disclosure records.

**Decision:** Yes, fix before the judged commit. Confirm usernames, contribution evidence, live URL, public visibility, and the exact SHA together. Do not guess a username or leave pending text in the final manifest.

### 5. Validate persisted browser data before using it

**Severity: High.**

The loader in [components/planner-app.tsx](components/planner-app.tsx) only checks that `parsed.windows` and `parsed.jobs` are arrays. I wrote `{ "windows": [], "jobs": [null] }` to the planner storage and reloaded the app. The page failed to load because [lib/scheduler.ts](lib/scheduler.ts) accessed `candidate.powerNeed` on `null`.

**Why this matters:** One bad saved value can make the live app unusable on the next visit. A user or judge has no recovery control once the render fails.

**Decision:** Yes, fix if the team accepts a small defensive boundary. Validate every window and job before putting it into state. If validation fails, discard the saved state and return to the demo/default state without crashing.

### 6. Handle unavailable or failing browser storage

**Severity: Medium.**

The `localStorage.getItem`, `removeItem`, and `setItem` calls in [components/planner-app.tsx](components/planner-app.tsx) are not all protected. I simulated blocked storage by making `Storage.prototype.setItem` throw, then changed an outage window. The app entered the Next.js error overlay instead of continuing without persistence.

**Why this matters:** Storage can be blocked, unavailable, or full. The UI currently says `Saved in this browser` even when saving cannot work.

**Decision:** Yes, fix if time allows before the judged commit. Treat storage as an optional enhancement. Keep the planner usable in memory and change the status copy when persistence is unavailable.

### 7. Enforce whole-minute validation while editing jobs

**Severity: Medium.**

The add form validates a whole number from 1 to 1,440, but the editable queue writes `Number(event.target.value)` directly. The queue input has no `step="1"` and no inline validation. I edited a job to `30.5`; the job became unplaced, but a generator job displayed `30.5` generator minutes.

**Why this matters:** P01 defines job duration in minutes, and the product copy promises whole-minute input. The visible total should never become fractional because of an edit that the interface allows.

**Decision:** Yes, fix. Use one validation path for new and edited jobs. Keep invalid edits visible with an error state, but exclude invalid values from scheduling and totals until corrected, or prevent the invalid value from being committed.

### 8. Close the accessibility gaps in the timeline and errors

**Severity: Medium.**

The browser accessibility snapshot found good labels for the main form controls, skip link, keyboard focus, and live generator metric. It also found these gaps:

- Outage bars use `title` but have no accessible label or role.
- Outage and job field errors are not connected with `aria-invalid` and `aria-describedby`.
- In Bangla mode, `Plan summary`, `Timeline legend`, `Scrollable 24-hour timeline`, and `Schedule results` remain English because their `aria-label` values are hard-coded.

**Why this matters:** A judge using a screen reader receives less information than a sighted judge, especially for the central outage timeline.

**Decision:** Recommended. Add localized labels and error relationships. Give each outage interval a concise accessible name that includes its start and end time.

### 9. Make browser QA claims reproducible or qualify them

**Severity: Medium.**

`README.md` claims browser QA covered desktop, 390px mobile, accessibility, overflow, error overlays, and console errors. The repository contains only [tests/scheduler.test.ts](tests/scheduler.test.ts). `package.json` has no Playwright, Cypress, axe, Lighthouse, or browser-test script.

**Why this matters:** The claim is not reproducible from the submitted repository. The attached rubric gives meaningful weight to Technical Execution and Demo and Documentation.

**Decision:** Recommended. Add a small browser test setup if the remaining time is real. Otherwise change the README to state exactly what was manually verified and keep the test list limited to evidence that exists in the repository.

### 10. Narrow the offline claim

**Severity: Low.**

The app has no API dependency and its calculations run in the browser. That supports the claim that the planner does not need a network service while open. However, [app/manifest.ts](app/manifest.ts) only describes the web app; there is no service worker or cache strategy. Reloading the app offline is not guaranteed.

**Why this matters:** The current wording in `docs/solution-fit.md` says the app works offline after load, which is stronger than the implementation proves.

**Decision:** Recommended. Say that the planner has no network-dependent feature and that browser storage is local. Do not promise offline reload behavior unless it is implemented and tested.

### 11. Add the missing README submission details

**Severity: Medium.**

The attached submission guide requires the README to explain what the project does, how to run it, what is mocked, and what would be built next. The current README explains the product and setup, but it does not clearly identify a `mocked` section or a `next steps` section.

**Why this matters:** The app intentionally uses user-entered outages rather than an official outage feed, and it models one work stream rather than a full operations system. Making those boundaries explicit helps judges understand the design choice.

**Decision:** Recommended. Add short sections stating that outage data is user-entered and that multi-worker planning, official schedules, and cross-device sync are future work. Keep the current scope.

## Verified strengths and no-change areas

- `pnpm install --frozen-lockfile` completed with pnpm 10.28.2.
- `pnpm check` passed: 7 scheduler tests, TypeScript, and production build.
- A 500-plan randomized invariant check found no overlap between planned jobs and no grid job inside an outage.
- The four required flows work in the local browser: outage entry and timeline, job entry, automatic placement, and generator-minute updates.
- Add, edit, remove, demo reset, Bangla switching, and reload persistence worked.
- Overnight outage input from 22:30 to 01:00 split correctly, and grid jobs remained outside the cut.
- The 390px layout kept page width at the viewport width. The timeline scrolled inside its own panel.
- The main visual direction is clear and focused. The dark surface, lime metric, outage bars, power legend, and aligned plan make the core behavior easy to scan.
- The deterministic scheduling policy is understandable and well separated from the React view. Do not replace it with prediction or a more complex optimizer without a failing requirement to justify that work.
- No code-quality or styling cleanup is needed solely for appearance. Fix the numbered reliability, accessibility, and submission items that have a clear payoff.

## Implementation update

The current working tree addresses the product-side findings from points 5 through 8:

- Persisted plans are schema-checked before entering React state. Invalid saved data falls back safely.
- Browser storage failures no longer take down the planner. The UI reports when saving is unavailable and keeps working in memory.
- New and edited job durations share the same whole-minute validator. Invalid generator durations do not inflate the generator-minute total.
- Timeline labels and validation errors now expose localized accessible names and error relationships. Bangla mode no longer leaves the main region labels in English.

Deployment, submission metadata, contribution evidence, scoring-source reconciliation, demo length, README submission wording, and browser-test infrastructure were intentionally left unchanged in this pass.

## Pre-submission checklist

- [ ] Deploy KajChole and verify the URL in a private browser window.
- [ ] Replace the empty `live_url` and pending contribution records in `evaluation-manifest.json`.
- [ ] Reconcile the leader username across repository documents.
- [ ] Confirm the official scoring and deadline wording with the live event source.
- [ ] Produce a demo video of 60 seconds or less.
- [ ] Confirm the README states what is mocked and what comes next.
- [ ] Confirm both repositories are public and preserve their history.
- [ ] Record the exact 40-character SHA that the team submits.
- [ ] Run the four-flow demo after the final judged commit.
- [ ] Submit both repository URLs, exact SHAs, and live URLs before the organizer's deadline.

