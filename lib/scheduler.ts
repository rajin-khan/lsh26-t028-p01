import type {
  DayPlan,
  Job,
  MinuteInterval,
  OutageWindow,
  PlannedJob,
  PowerNeed,
  UnplacedJob,
} from "./types.ts";

export const MINUTES_PER_DAY = 24 * 60;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDuration(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MINUTES_PER_DAY;
}

export function timeToMinute(value: string): number | null {
  const match = TIME_RE.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minuteToTime(value: number): string {
  const minute = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(value)));
  if (minute === MINUTES_PER_DAY) return "24:00";
  const hour = Math.floor(minute / 60);
  const remainder = minute % 60;
  return `${String(hour).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function windowError(window: OutageWindow): string | null {
  const start = timeToMinute(window.start);
  const end = timeToMinute(window.end);
  if (start === null || end === null) return "Use a valid 24-hour time.";
  if (start === end) return "Start and end times must be different.";
  return null;
}

export function normalizeOutageWindows(windows: OutageWindow[]): MinuteInterval[] {
  const intervals: MinuteInterval[] = [];

  for (const window of windows) {
    const start = timeToMinute(window.start);
    const end = timeToMinute(window.end);
    if (start === null || end === null || start === end) continue;

    if (end > start) {
      intervals.push({ start, end });
    } else {
      intervals.push({ start, end: MINUTES_PER_DAY });
      if (end > 0) intervals.push({ start: 0, end });
    }
  }

  return mergeIntervals(intervals);
}

export function mergeIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
  const sorted = intervals
    .filter(({ start, end }) => start >= 0 && end <= MINUTES_PER_DAY && end > start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: MinuteInterval[] = [];

  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval });
    } else {
      previous.end = Math.max(previous.end, interval.end);
    }
  }

  return merged;
}

export function subtractIntervals(
  bases: MinuteInterval[],
  blocked: MinuteInterval[],
): MinuteInterval[] {
  const result: MinuteInterval[] = [];
  const normalizedBlocked = mergeIntervals(blocked);

  for (const base of mergeIntervals(bases)) {
    let cursor = base.start;
    for (const block of normalizedBlocked) {
      if (block.end <= cursor || block.start >= base.end) continue;
      if (block.start > cursor) {
        result.push({ start: cursor, end: Math.min(block.start, base.end) });
      }
      cursor = Math.max(cursor, block.end);
      if (cursor >= base.end) break;
    }
    if (cursor < base.end) result.push({ start: cursor, end: base.end });
  }

  return result;
}

function stableLongestFirst(jobs: Job[]): Job[] {
  return jobs
    .map((job, index) => ({ job, index }))
    .sort((a, b) => b.job.duration - a.job.duration || a.index - b.index)
    .map(({ job }) => job);
}

function findFirstFit(
  allowed: MinuteInterval[],
  occupied: MinuteInterval[],
  duration: number,
): MinuteInterval | null {
  const free = subtractIntervals(allowed, occupied);
  const fit = free.find((interval) => interval.end - interval.start >= duration);
  return fit ? { start: fit.start, end: fit.start + duration } : null;
}

function placeGroup(
  jobs: Job[],
  powerNeed: PowerNeed,
  preferred: MinuteInterval[],
  fallback: MinuteInterval[],
  occupied: MinuteInterval[],
  planned: PlannedJob[],
  unplaced: UnplacedJob[],
): void {
  for (const job of stableLongestFirst(jobs.filter((candidate) => candidate.powerNeed === powerNeed))) {
    if (!isValidDuration(job.duration)) {
      unplaced.push({ ...job, reason: "invalid_duration" });
      continue;
    }

    const placement =
      findFirstFit(preferred, occupied, job.duration) ??
      findFirstFit(fallback, occupied, job.duration);

    if (!placement) {
      unplaced.push({
        ...job,
        reason: powerNeed === "grid" ? "no_grid_window" : "day_full",
      });
      continue;
    }

    occupied.push(placement);
    planned.push({ ...job, ...placement });
  }
}

export function buildDayPlan(windows: OutageWindow[], jobs: Job[]): DayPlan {
  const day = [{ start: 0, end: MINUTES_PER_DAY }];
  const outageIntervals = normalizeOutageWindows(windows);
  const gridAvailable = subtractIntervals(day, outageIntervals);
  const occupied: MinuteInterval[] = [];
  const planned: PlannedJob[] = [];
  const unplaced: UnplacedJob[] = [];

  placeGroup(jobs, "grid", gridAvailable, [], occupied, planned, unplaced);
  placeGroup(jobs, "generator", outageIntervals, day, occupied, planned, unplaced);
  placeGroup(jobs, "none", outageIntervals, day, occupied, planned, unplaced);

  const orderedPlan = planned.sort((a, b) => a.start - b.start || a.end - b.end);

  return {
    outageIntervals,
    planned: orderedPlan,
    unplaced,
    generatorMinutes: orderedPlan
      .filter((job) => job.powerNeed === "generator")
      .reduce((total, job) => total + job.duration, 0),
  };
}

export function intervalsOverlap(a: MinuteInterval, b: MinuteInterval): boolean {
  return a.start < b.end && b.start < a.end;
}
