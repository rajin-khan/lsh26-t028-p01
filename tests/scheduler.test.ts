import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDayPlan,
  intervalsOverlap,
  minuteToTime,
  normalizeOutageWindows,
  subtractIntervals,
  timeToMinute,
} from "../lib/scheduler.ts";
import type { Job, OutageWindow } from "../lib/types.ts";

function outage(id: string, start: string, end: string): OutageWindow {
  return { id, start, end };
}

function job(id: string, duration: number, powerNeed: Job["powerNeed"]): Job {
  return { id, name: id, duration, powerNeed };
}

test("parses and formats day times", () => {
  assert.equal(timeToMinute("00:00"), 0);
  assert.equal(timeToMinute("23:59"), 1439);
  assert.equal(timeToMinute("24:00"), null);
  assert.equal(timeToMinute("9:30"), null);
  assert.equal(minuteToTime(0), "00:00");
  assert.equal(minuteToTime(1440), "24:00");
});

test("normalizes, splits, and merges outage windows", () => {
  assert.deepEqual(
    normalizeOutageWindows([
      outage("a", "22:30", "01:00"),
      outage("b", "00:45", "02:00"),
      outage("c", "10:00", "11:00"),
      outage("d", "10:30", "12:00"),
    ]),
    [
      { start: 0, end: 120 },
      { start: 600, end: 720 },
      { start: 1350, end: 1440 },
    ],
  );
});

test("subtracts blocked minutes from allowed time", () => {
  assert.deepEqual(
    subtractIntervals(
      [{ start: 0, end: 300 }],
      [
        { start: 60, end: 120 },
        { start: 180, end: 240 },
      ],
    ),
    [
      { start: 0, end: 60 },
      { start: 120, end: 180 },
      { start: 240, end: 300 },
    ],
  );
});

test("places grid jobs outside outage windows and keeps jobs separate", () => {
  const plan = buildDayPlan(
    [outage("cut", "09:00", "11:00")],
    [
      job("grid-long", 120, "grid"),
      job("grid-short", 60, "grid"),
      job("generator", 60, "generator"),
      job("offline", 45, "none"),
    ],
  );

  const cut = plan.outageIntervals[0];
  const gridJobs = plan.planned.filter((entry) => entry.powerNeed === "grid");
  assert.equal(gridJobs.some((entry) => intervalsOverlap(entry, cut)), false);
  assert.deepEqual(
    plan.planned.map(({ id, start, end }) => ({ id, start, end })),
    [
      { id: "grid-long", start: 0, end: 120 },
      { id: "grid-short", start: 120, end: 180 },
      { id: "generator", start: 540, end: 600 },
      { id: "offline", start: 600, end: 645 },
    ],
  );

  for (let index = 1; index < plan.planned.length; index += 1) {
    assert.equal(intervalsOverlap(plan.planned[index - 1], plan.planned[index]), false);
  }
});

test("counts generator duration immediately from the job list", () => {
  const baseJobs = [job("pump", 55, "generator"), job("email", 20, "none")];
  assert.equal(buildDayPlan([], baseJobs).generatorMinutes, 55);
  assert.equal(buildDayPlan([], [...baseJobs, job("welding", 35, "generator")]).generatorMinutes, 90);
  assert.equal(buildDayPlan([], baseJobs.slice(1)).generatorMinutes, 0);
});

test("leaves a grid job unplaced when no continuous powered slot is long enough", () => {
  const plan = buildDayPlan(
    [
      outage("morning", "01:00", "12:00"),
      outage("evening", "13:00", "23:00"),
    ],
    [job("four-hour-grid-job", 240, "grid")],
  );

  assert.equal(plan.planned.length, 0);
  assert.equal(plan.unplaced[0]?.reason, "no_grid_window");
});

test("rejects jobs that would have to cross the end of the planning day", () => {
  const jobs = [job("all-day", 1380, "none"), job("too-late", 90, "none")];
  const plan = buildDayPlan([], jobs);
  assert.equal(plan.planned.length, 1);
  assert.equal(plan.unplaced[0]?.id, "too-late");
  assert.equal(plan.unplaced[0]?.reason, "day_full");
});
