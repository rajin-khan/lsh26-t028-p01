# LofiStack Hackathon 2026 context

## Team and repository mapping

- Team: GROCERYBOIX
- Team ID: LSH26-T028
- Team leader: Rajin Dash Khan, GitHub username `RajinDashKhan`
- This repository is the team's P01 project.
- The sibling repository `lsh26-t028-p-2` is the team's P10 project.
- Event start code: `LSH26-8490-C900`

## What the event rewards

The score is out of 100:

- Functionality: 30
- Technical quality: 15
- UI and UX: 15
- Demo and documentation: 15
- Difficulty credit: 15
- Early submission: 10

Each problem has four required items. The early-submission bonus unlocks only when at least three of four required items work for both projects. Working features come before bonus features. The build window is 6 PM to 10 PM, and the final submission deadline is 11:59 PM. Submit before 10 PM if the two-project minimum is ready.

The team submits two public GitHub repositories through one leader-submitted form. The form requires each public repository URL, the exact 40-character commit SHA being judged, and a live URL. Keep both repositories public and preserve their history. AI tools are allowed. Disclose pre-event material, third-party material, and AI use. Never commit secrets.

## Why this pair was chosen

P01 is Tier 1, but the team already has CurrentJabe at `/Users/rajin/Developer/ACTIVE/TPCWHOLE/currentjabe`, a community electricity outage map and forecast product. It already contains outage-window concepts, time handling, electricity-focused copy, a polished interface, and a Bangladesh-focused product direction. P01 is the safest way to turn that head start into a complete working submission.

P10 is Tier 2 and has a bounded, deterministic calculation problem. It also shares the electricity domain and can reuse the team's visual language and relevant calculation patterns. The extra Tier 2 credit is worth taking only if the project still reaches at least three working required items before the early-bonus cutoff.

## P01: load-shedding window planner

In simple terms, the user enters today's power-cut periods and a list of jobs. The app places jobs into the day so grid-dependent jobs avoid power cuts, then shows how many minutes of generator use the plan needs.

The four required items are:

1. Enter today's power-cut start and end times and show them on a 24-hour timeline.
2. Add jobs with a name, duration in minutes, and power need: grid power, generator, or no power.
3. Automatically place jobs so grid-power jobs do not overlap a power cut. Show the completed plan beside the power-cut bars.
4. Show total generator minutes, updating immediately when jobs are added or removed.

CurrentJabe is useful source material, but it is not P01 by itself. The P01 submission must clearly be a planner with jobs, placement, conflict avoidance, and generator-minute totals. If time is tight, make those four flows reliable before adding richer forecasting or map work.

Important edge cases to handle visibly:

- A job that crosses midnight or cannot fit in the available day.
- Multiple power-cut windows.
- Jobs that need no power, which can run during a cut.
- Generator jobs, which may run during a cut and count toward generator minutes.
- Removing or editing a job must recalculate the plan and total.

## P10: prepaid meter recharge advisor

In simple terms, the app shows how a household's prepaid electricity balance changes over time. It explains the tariff, predicts when the balance will run out, calculates how much to recharge to last until a chosen date, and compares two recharge habits.

The four required items are:

1. Create a household with at least six months of daily unit readings and recharge history. Include a light month, a heavy summer month, and a month with a large recharge during the last week.
2. Rebuild the meter balance day by day using the stated tariff. Charge each day's units using that month's running slab total, apply demand charge and meter rent on the first recharge of each month, add 5% VAT to energy, and show the balance line with every recharge marked.
3. Given today's balance and usual daily use, show the date the balance runs out. Given a target date, calculate the recharge needed today and split it into energy, higher-slab cost, fixed charges, and VAT.
4. Compare "low balance" recharges with "monthly" recharges over the same three months and identical consumption. Show which costs less and by how much.

Use only the published tariff:

- Units 1 to 75: 4.63 taka per unit
- Units 76 to 200: 5.26 taka per unit
- Units 201 to 300: 5.63 taka per unit
- Units 301 to 400: 5.83 taka per unit
- Units 401 to 600: 9.30 taka per unit
- Units 601 and above: 10.70 taka per unit
- Demand charge: 42 taka once per month, on the first recharge
- Meter rent: 40 taka once per month, on the first recharge
- VAT: 5% of the energy amount

The slab counter resets at the beginning of each calendar month. Recharge timing does not change the energy rate. Both habits use the same daily consumption and the same monthly slab counter. "Cost" means energy, VAT, and applicable monthly fixed charges, not the amount deposited. The two habits may cost the same. Any difference should come only from the number of months in which the first-recharge fixed charges are applied.

## Practical order of work

1. Get three required items working in each repository.
2. Make the fourth item work.
3. Add clear empty states, validation, and a small visible explanation of the calculations.
4. Test the exact tariff boundaries and power-cut overlaps.
5. Add README, `EVENT.md`, `LICENSES.md`, and the required `evaluation-manifest.json` before creating the judged commit.
6. Deploy both apps, make both repositories public, then submit the exact judged SHAs through the leader form.
