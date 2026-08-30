export type PowerNeed = "grid" | "generator" | "none";

export type OutageWindow = {
  id: string;
  start: string;
  end: string;
};

export type Job = {
  id: string;
  name: string;
  duration: number;
  powerNeed: PowerNeed;
};

export type MinuteInterval = {
  start: number;
  end: number;
};

export type PlannedJob = Job & {
  start: number;
  end: number;
};

export type UnplacedJob = Job & {
  reason: "no_grid_window" | "day_full" | "invalid_duration";
};

export type DayPlan = {
  outageIntervals: MinuteInterval[];
  planned: PlannedJob[];
  unplaced: UnplacedJob[];
  generatorMinutes: number;
};
