# KajChole

Enter today's power cuts and jobs. KajChole places jobs on a 24-hour timeline, keeps grid-powered work outside cuts, and counts the generator minutes needed by the scheduled jobs.

- Team: GROCERYBOIX, `LSH26-T028`
- Problem: `P01`, Load-Shedding Window Planner
- Repository: [rajin-khan/lsh26-t028-p01](https://github.com/rajin-khan/lsh26-t028-p01)
- Live URL: pending deployment
- Event start code: `LSH26-8490-C900`

## Run it

Requirements: Node.js 22 or newer and pnpm 10. No environment variables, accounts, API keys, or database are needed. Use the committed lockfile.

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

Complete. **Power-cut windows** accepts multiple start and end times. An end before its start crosses midnight. Overlapping and adjacent cuts merge. Invalid or equal start/end times show an error and are excluded until corrected.

**Today's plan** aligns every cut on a shared 00:00 to 24:00 scale. The timeline scrolls inside its panel on narrow screens instead of widening the page.

Source: `normalizeOutageWindows` and `mergeIntervals` in `lib/scheduler.ts`, rendered by `components/planner-app.tsx`.

### R2, jobs and power needs

Complete. **Add a job** captures:

- a required name;
- a whole-minute duration from 1 to 1,440;
- grid power, generator, or no power.

Every field remains editable in **Job inputs**. Removing or editing a job recalculates the plan. Invalid durations show an error and are excluded from scheduling. Browser storage preserves the working plan when available; blocked storage does not stop the app. **Load demo** restores the built-in sample, and **Undo** restores the previous plan after a removal or reset.

### R3, automatic placement

Complete. The deterministic scheduler uses this policy:

1. Sort grid jobs longest first and place them only in grid-available time.
2. Place generator jobs in outage time where possible, then any free time.
3. Place no-power jobs in remaining outage time where possible, then any free time.
4. Never overlap jobs.
5. Show jobs that cannot finish before 24:00 in **Needs attention**.

The same result appears as bars beside the outage lane and as rows in **Scheduled jobs**. It plans around supplied times; it does not predict outages.

Source: `buildDayPlan`, `findFirstFit`, and `subtractIntervals` in `lib/scheduler.ts`.

### R4, live generator minutes

Complete. The summary shows the total duration of scheduled generator jobs. From **Load demo**, add a 30-minute generator job: the total changes from 50 to 80. Edit it to 45: the total becomes 95. Remove it: the total returns to 50. Generator jobs that cannot fit are shown under **Needs attention** and do not count toward scheduled minutes.

`buildDayPlan` derives the value from the placements on every input change.

## Sample data and judge inputs

**Load demo** restores two cuts (09:30 to 11:00 and 17:45 to 19:15) and four jobs: grid 75 minutes, grid 45 minutes, generator 50 minutes, and no power 90 minutes. The starting generator total is 50.

The submission kit allows manual entry of published or judge-supplied cases. To enter a case from `P01_load_shedding_public.json`, remove the existing cuts and jobs, then copy:

- `cuts[].start` and `cuts[].end` into **Power-cut windows**;
- `jobs[].name` into **Job name**;
- `jobs[].minutes` into **Duration**;
- `jobs[].power` into **Power need** (`grid`, `generator`, or `none`).

There is no JSON upload. The planner uses the full 00:00 to 24:00 day specified by P01; fixture `shop_open` and `shop_close` metadata do not constrain placement. Use **Load demo** to reset after judging.

## Technical decisions

- Pure TypeScript interval functions keep scheduling deterministic and easy to test.
- A 1,440-minute integer day avoids date, time-zone, and daylight-saving ambiguity.
- Client-side calculation removes API, authentication, deployment-secret, and database failure modes during judging.
- Browser storage preserves the current plan without collecting personal data.
- Native form controls, visible labels and errors, a skip link, keyboard focus, reduced-motion handling, and an English/Bangla switch support accessible use.
- Color distinguishes power needs; text labels repeat that information. English and Bangla controls use the same saved inputs.

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

Browser checks are manual, not part of `pnpm check`. They cover desktop/mobile layout, add/edit/remove, generator totals, Bangla, validation, and unplaced jobs. The repository does not include a browser automation suite.

## Known limitations

- The planner models one non-overlapping work stream. It does not model parallel staff or machines.
- Jobs must finish within the current 00:00 to 24:00 planning day.
- Generator minutes describe scheduled generator work, not fuel volume, fuel cost, or emissions.
- The plan stays in one browser. It is not synced across devices.
- The longest-first policy is deterministic, not a guarantee of the mathematically optimal packing.
- Offline reload is not supported.

## Mocked data and next steps

The built-in demo is invented sample data. Outage times are entered by the user, not fetched from a utility. Scheduling and generator totals are calculated, not mocked.

A next version could let users set working hours, import JSON cases, and model separate workers or machines. Those features are outside this submission.

## Team and disclosure

| Registered member | GitHub username | Contribution | Evidence |
| --- | --- | --- | --- |
| Adib Ar Rahman Khan (Rajin Khan) | [`rajin-khan`](https://github.com/rajin-khan) | Team lead, P01 product direction, scheduler and interface implementation with AI assistance, verification and final review | `30df1c2`, `5dbbae2`, `lib/scheduler.ts`, `components/planner-app.tsx` |
| Saumik Saha Kabbya | [`Kabbya04`](https://github.com/Kabbya04) | P01 saved-state validation, storage recovery, editing/accessibility fixes, interaction flow and form controls | Commits `a1bf3b4`, `63fdcb2`, `e2ad115` record Saumik as committer |
| Samiyeel Alim Binaaf | [`Pronaaf2k`](https://github.com/Pronaaf2k) | Team-wide work on the sibling P10 submission: fixture validation, target advice, font fallback and responsive chart; not P01 source changes | P10 commits `92d4c48`, `22c38b2`, `ebfe902` |

OpenAI Codex assisted with the requirement audit, domain model, deterministic scheduler, bilingual interface, tests, documentation, and browser QA under the team lead's direction. The team verifies the output with the checks above. Pre-event materials are disclosed in `evaluation-manifest.json`; third-party material is listed in `LICENSES.md`.

The optional recording script is in `docs/DEMO.md`. Before final submission, the team lead must add the deployed URL here and in the manifest, make the repository public, and copy the exact judged commit SHA into the submission form. Deployment is intentionally not part of this local review.
