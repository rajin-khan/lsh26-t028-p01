# Three-minute demo

## Before recording

1. Open the live URL in a private browser window.
2. Select **Load demo**.
3. Keep the browser at a normal laptop width and 100% zoom.
4. Have this repository's `README.md` and `evaluation-manifest.json` ready in separate tabs.

## Recording flow

### 0:00 to 0:20, the problem

"Load shedding turns a list of jobs into guesswork. KajChole takes today's known power cuts and work, then builds one plan that respects each job's power need."

Point to the two outage inputs, the job queue, and the generator-minute total. Keep the four requirements in one frame.

### 0:20 to 0:50, outage windows

Show the two sample cuts. Add one more window. Explain that an end earlier than its start crosses midnight and that overlapping cuts merge automatically.

Point to the hatched red bars on the 24-hour scale.

### 0:50 to 1:25, job inputs

Add a job named **Backup router**, duration **30**, power need **Generator**.

Show the generator total changing from 50 to 80 immediately. Edit the new duration to 45 and show the total becoming 95. Remove the job and show the total return to 50.

### 1:25 to 2:00, automatic scheduling

Point out that both grid jobs sit outside every red cut. The water pump uses generator time during a cut. Stock counting needs no power and fills another cut.

Show the exact times in **Completed plan**. Explain that the algorithm protects longer grid jobs first, never overlaps jobs, and visibly reports anything that cannot fit.

### 2:00 to 2:20, edge case

Add **All-day grid run**, duration **1440**, power need **Grid power**. Show **Needs attention** and its explanation. Remove or reset the demo afterward.

### 2:20 to 2:35, Bangla and mobile

Switch to Bangla. Briefly narrow the browser or show a prepared mobile capture. The timeline scrolls inside its panel while the rest of the page stays fixed to the viewport.

### 2:35 to 3:00, technical proof

Open the README requirement evidence and test list. State that KajChole is deterministic, local-first, free of API and database dependencies, and verified by scheduler tests, strict TypeScript, a production build, desktop/mobile browser QA, and a complete evaluation manifest.

Finish with the public repository URL, live URL, and exact judged commit SHA on screen.
