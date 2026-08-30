# KajChole

KajChole answers a practical load-shedding question: "When can today's work actually happen?" Enter the day's power cuts and jobs. The app builds one conflict-free plan, keeps grid-dependent work outside outage windows, and updates total generator minutes after every job change.

- Team: GROCERYBOIX, `LSH26-T028`
- Problem: `P01`, Load-Shedding Window Planner
- Repository: `https://github.com/Kabbya04/lsh26-t028-p-1`
- Live URL: pending deployment
- Event start code: `LSH26-8490-C900`

## Run it

Requirements: Node.js 22 or newer and pnpm 10. KajChole has no environment variables, accounts, Supabase project, API keys, or network-dependent features.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`.

Run the submission checks with:

```bash
pnpm check
```

## Requirement evidence

### R1, outage entry and 24-hour timeline

Complete. **Power-cut windows** accepts any number of start and end times. An end before its start crosses midnight. Overlapping and adjacent cuts merge into a clean set of intervals.

The **Today's power map** aligns every cut on a shared 00:00 to 24:00 scale. The timeline scrolls inside its panel on narrow screens instead of widening the page.

Source: `normalizeOutageWindows` and `mergeIntervals` in `lib/scheduler.ts`, rendered by `components/planner-app.tsx`.

### R2, jobs and power needs

Complete. **Add a job** captures:

- a required name;
- a whole-minute duration from 1 to 1,440;
- grid power, generator, or no power.

Every saved field remains editable in **Job queue**. Removing or editing a job recalculates the plan. The working state is stored in the browser and **Load demo** restores the documented sample.

### R3, automatic placement

Complete. The deterministic scheduler uses this policy:

1. Sort grid jobs longest first and place them only in grid-available time.
2. Place generator jobs in outage time where possible, then any free time.
3. Place no-power jobs in remaining outage time where possible, then any free time.
4. Never overlap jobs.
5. Show jobs that cannot finish before 24:00 in **Needs attention**.

The same result appears as bars beside the outage lane and as rows in **Completed plan**. The app does not claim to predict outages. It plans around the times the user supplies.

Source: `buildDayPlan`, `findFirstFit`, and `subtractIntervals` in `lib/scheduler.ts`.

### R4, live generator minutes

Complete. The lime summary block shows the sum of every generator job's requested duration. Adding a 30-minute generator job increases the number by 30. Editing it to 45 adds 45 instead. Removing it restores the prior total.

The value is derived from the current job list inside `buildDayPlan`, so it cannot drift from the visible inputs.

## Technical decisions

- Pure TypeScript interval functions keep scheduling deterministic and easy to test.
- A 1,440-minute integer day avoids date, time-zone, and daylight-saving ambiguity.
- Client-side calculation removes API, authentication, deployment-secret, and database failure modes during judging.
- Browser storage preserves the current plan without collecting personal data.
- Native form controls, visible labels and errors, a skip link, keyboard focus, reduced-motion handling, and an English/Bangla switch support accessible use.
- The dark interface uses one lime planning accent, amber generator work, neutral no-power work, and hatched red outage bars. It does not reuse CurrentJabe's name, logo, paper palette, red accent, map, or page composition.

The product glossary is in `CONTEXT.md`. The audit of CurrentJabe and GridGenius is in `docs/solution-fit.md`.

## Tests

`tests/scheduler.test.ts` checks:

- strict `HH:mm` parsing and 24:00 display;
- splitting an outage that crosses midnight;
- merging overlapping outages;
- subtracting blocked time from available time;
- grid jobs never overlapping a cut;
- all planned jobs remaining non-overlapping;
- generator minutes updating with add and removal scenarios;
- grid work with no valid continuous slot becoming unplaced;
- work that would cross 24:00 becoming unplaced.

Browser QA covers desktop and 390px mobile layouts, add/edit/remove recalculation, generator totals, the Bangla interface, the unplaced state, page overflow, error overlays, and console errors.

## Known limitations

- The planner models one non-overlapping work stream. It does not model parallel staff or machines.
- Jobs must finish within the current 00:00 to 24:00 planning day.
- Generator minutes describe requested job duration, not fuel volume, fuel cost, or emissions.
- The plan stays in one browser. It is not synced across devices.

## Team and disclosure

- Rajin Dash Khan, [`rajin-khan`](https://github.com/rajin-khan): team lead, problem selection, prior-project handoff, product direction, repository setup, verification, deployment, and submission ownership.
- Saumik Saha Kabbya, [`Kabbya04`](https://github.com/Kabbya04): contribution record to be confirmed before the judged commit.
- Samiyeel Alim Binaaf, [`Pronaaf2k`](https://github.com/Pronaaf2k): contribution record to be confirmed before the judged commit.

OpenAI Codex assisted with the requirement audit, domain model, deterministic scheduler, bilingual interface, tests, documentation, and browser QA under the team lead's direction. The team verifies the output with the checks above. Pre-event materials are disclosed in `evaluation-manifest.json`; third-party material is listed in `LICENSES.md`.

The optional recording script is in `docs/DEMO.md`.
