# P01 solution fit

## Verdict

CurrentJabe is not an exact solution to P01. It is a useful source of domain behavior and frontend discipline.

Against the four required items, the existing product has one partial match and three missing flows:

| P01 requirement | CurrentJabe coverage | What can be reused |
| --- | --- | --- |
| Enter outage windows and show a 24-hour timeline | Partial | Valid 24-hour time parsing, overnight-window normalization, multiple-window data shapes, English and Bangla electricity language |
| Add jobs with name, duration, and power need | Missing | General form validation and accessible interaction patterns only |
| Automatically place jobs around outages | Missing | Interval and overlap concepts, but not the forecast algorithm itself |
| Update generator minutes when jobs change | Missing | Reactive React patterns only |

Both products deal with electricity outages in Bangladesh, but the job scheduler had to be written for P01.

## What we should reuse

- The Next.js and TypeScript stack already proven in CurrentJabe.
- Strict `HH:mm` time validation.
- Treating an end time earlier than its start as a window crossing midnight.
- Multiple outage-window entry.
- Clear distinctions between user-entered outage information and official schedules.
- Accessible forms, visible errors, responsive layouts, and Bangla-ready typography.
- CurrentJabe's caution around electricity claims. KajChole must never claim to predict outages.

## What we should leave behind

- Community reports, contributor thresholds, and forecasts.
- Bangladesh maps, location search, feeder data, and geographic hierarchy.
- Supabase, accounts, administration, network calls, and persistent public data.
- The CurrentJabe name, logo, warm paper palette, red accent, and page composition.
- The GridGenius model, RAG assistant, prediction API, and national-demand dataset.

These systems solve different problems. Pulling them into P01 would consume build time without satisfying a required item.

## What GridGenius contributes

GridGenius gives the project a credible Bangladesh energy-planning context and experience presenting time-based energy information. It does not provide the P01 scheduling algorithm. P01 is deterministic: the app already knows the outage windows, job durations, and power needs. Machine learning would make the result harder to explain and test.

## Product decision

Build KajChole as a single-page planning tool. All calculations run in the browser. The app ships with sample data, saves the current plan locally when browser storage is available, and does not call an API for planning. Offline reload is not supported.

The scheduler follows a visible, deterministic policy:

1. Place longer grid jobs first into grid-available time.
2. Place generator jobs into outage time where possible, then any free time.
3. Place no-power jobs into remaining outage time where possible, then any free time.
4. Never overlap jobs.
5. Leave a job visibly unplaced if it cannot fit before 24:00.

This policy protects the hardest constraint first and makes the same inputs produce the same plan every time.

## Judge-facing proof

The main screen must make all four required items visible without navigation:

- outage entry and 24-hour outage bars;
- job entry with all three power needs;
- a completed plan aligned to the same time scale;
- live generator minutes.

Editing, removal, overnight windows, multiple windows, local persistence, sample reset, empty states, and unplaced-job explanations support UI, technical-quality, and demo marks after the four core items work.
