"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  buildDayPlan,
  isValidDuration,
  MINUTES_PER_DAY,
  minuteToTime,
  windowError,
} from "@/lib/scheduler";
import type { Job, OutageWindow, PlannedJob, PowerNeed, UnplacedJob } from "@/lib/types";

type Locale = "en" | "bn";

type PlannerState = {
  windows: OutageWindow[];
  jobs: Job[];
};

type UndoState = PlannerState & {
  message: string;
};

const STORAGE_KEY = "kajchole-planner-v1";

const SAMPLE_STATE: PlannerState = {
  windows: [
    { id: "outage-morning", start: "09:30", end: "11:00" },
    { id: "outage-evening", start: "17:45", end: "19:15" },
  ],
  jobs: [
    { id: "job-freezer", name: "Cold storage check", duration: 75, powerNeed: "grid" },
    { id: "job-print", name: "Print dispatch labels", duration: 45, powerNeed: "grid" },
    { id: "job-pump", name: "Run water pump", duration: 50, powerNeed: "generator" },
    { id: "job-stock", name: "Count shelf stock", duration: 90, powerNeed: "none" },
  ],
};

function isPowerNeed(value: unknown): value is PowerNeed {
  return value === "grid" || value === "generator" || value === "none";
}

function isStoredWindow(value: unknown): value is OutageWindow {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.start === "string" &&
    typeof candidate.end === "string"
  );
}

function isStoredJob(value: unknown): value is Job {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    typeof candidate.duration === "number" &&
    Number.isFinite(candidate.duration) &&
    isPowerNeed(candidate.powerNeed)
  );
}

function parseStoredState(raw: string): PlannerState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PlannerState>;
    if (
      !Array.isArray(parsed.windows) ||
      !Array.isArray(parsed.jobs) ||
      !parsed.windows.every(isStoredWindow) ||
      !parsed.jobs.every(isStoredJob)
    ) {
      return null;
    }
    return { windows: parsed.windows, jobs: parsed.jobs };
  } catch {
    return null;
  }
}

const copy = {
  en: {
    skip: "Skip to planner",
    product: "KajChole",
    productBn: "কাজচলে",
    descriptor: "Load-shedding work planner",
    language: "বাংলা",
    reset: "Load demo",
    title: "Power goes. Work stays on plan.",
    intro: "Enter today's cuts and jobs. KajChole builds a conflict-free day and counts every generator minute.",
    planReady: "Ready to schedule",
    planNeedsAttention: "Needs a quick fix",
    generatorMetric: "Generator minutes",
    cutsMetric: "Power cuts",
    jobsScheduled: "jobs scheduled",
    planSummary: "Plan summary",
    timelineLegend: "Timeline legend",
    scrollableTimeline: "Scrollable 24-hour timeline",
    scheduleResults: "Schedule results",
    invalid: "invalid",
    setup: "Set up today",
    setupNote: "Times use a 24-hour clock. An end before its start crosses midnight.",
    outageTitle: "Power-cut windows",
    addWindow: "Add window",
    start: "Start",
    end: "End",
    removeWindow: "Remove outage window",
    noWindows: "No cuts entered. Grid power is treated as available all day.",
    newJob: "Add a job",
    jobName: "Job name",
    jobNamePlaceholder: "Example: Charge delivery bikes",
    duration: "Duration",
    minutesShort: "min",
    powerNeed: "Power need",
    grid: "Grid power",
    generator: "Generator",
    none: "No power",
    powerHintGrid: "Avoids power cuts.",
    powerHintGenerator: "Prefers cut windows.",
    powerHintNone: "Can run during cuts.",
    addJob: "Add job",
    nameRequired: "Give the job a name.",
    durationInvalid: "Use a whole number from 1 to 1,440.",
    timeInvalid: "Use a valid 24-hour time.",
    sameTime: "Start and end times must be different.",
    timelineTitle: "Today's plan",
    timelineNote: "Cuts and planned jobs share the same 24-hour scale.",
    outageLane: "Power cuts",
    workLane: "Work plan",
    availableAllDay: "Grid available all day",
    emptyTimeline: "Add a job to build the day plan.",
    queueTitle: "Job inputs",
    queueNote: "These jobs feed the plan. Edit any field and it recalculates.",
    removeJob: "Remove job",
    emptyQueue: "No jobs yet. Add the first job from the setup panel.",
    scheduleTitle: "Scheduled jobs",
    scheduleNote: "Longer grid jobs are protected first. Generator and no-power jobs prefer cut windows.",
    time: "Time",
    job: "Job",
    source: "Power",
    noPlan: "Your scheduled jobs will appear here after you add a job.",
    unplacedTitle: "Needs attention",
    noGridWindow: "No continuous grid-powered slot is long enough.",
    dayFull: "The job cannot fit before 24:00.",
    invalidDuration: "The duration must be a whole number from 1 to 1,440.",
    saved: "Saved in this browser",
    storageUnavailable: "Browser saving unavailable",
    localNote: "No account, API, or official outage claim. Your plan stays on this device.",
    outageDetail: "Power cut from {start} to {end}",
    windowRemoved: "Power-cut window removed.",
    jobRemoved: "Job removed.",
    demoLoaded: "Demo plan loaded.",
    undo: "Undo",
    restored: "Change restored.",
    adjustmentHint: "Try a shorter duration or a different power need.",
    howTitle: "How KajChole decides",
    howBody: "It schedules the hardest constraint first, then fills outage time with work that can continue without the grid.",
    ruleGrid: "Grid jobs never overlap a cut.",
    ruleGenerator: "Generator jobs count toward generator minutes.",
    ruleNone: "No-power jobs can use cut time at no energy cost.",
    jobAdded: "Job added and plan recalculated.",
  },
  bn: {
    skip: "পরিকল্পনায় যান",
    product: "KajChole",
    productBn: "কাজচলে",
    descriptor: "লোডশেডিং কাজের পরিকল্পনা",
    language: "English",
    reset: "ডেমো দেখুন",
    title: "বিদ্যুৎ গেলেও, কাজ থাকে পরিকল্পনায়।",
    intro: "আজকের বিদ্যুৎ বিভ্রাট ও কাজ লিখুন। কাজচলে সংঘর্ষহীন সময়সূচি বানিয়ে জেনারেটরের মোট সময় হিসাব করবে।",
    planReady: "পরিকল্পনা প্রস্তুত",
    planNeedsAttention: "একটি ছোট সংশোধন দরকার",
    generatorMetric: "জেনারেটরের মিনিট",
    cutsMetric: "বিদ্যুৎ বিভ্রাট",
    jobsScheduled: "টি কাজ পরিকল্পিত",
    planSummary: "পরিকল্পনার সারাংশ",
    timelineLegend: "সময়ের মাপের পরিচয়",
    scrollableTimeline: "স্ক্রল করা যায় এমন ২৪ ঘণ্টার সময়রেখা",
    scheduleResults: "পরিকল্পনার ফলাফল",
    invalid: "সঠিক নয়",
    setup: "আজকের তথ্য দিন",
    setupNote: "সময় ২৪ ঘণ্টার হিসাবে লিখুন। শেষের সময় আগে হলে বিভ্রাটটি মধ্যরাত পার হবে।",
    outageTitle: "বিদ্যুৎ বিভ্রাটের সময়",
    addWindow: "সময় যোগ করুন",
    start: "শুরু",
    end: "শেষ",
    removeWindow: "বিভ্রাটের সময় মুছুন",
    noWindows: "কোনো বিভ্রাট দেওয়া হয়নি। সারাদিন গ্রিড বিদ্যুৎ থাকবে ধরে নেওয়া হচ্ছে।",
    newJob: "কাজ যোগ করুন",
    jobName: "কাজের নাম",
    jobNamePlaceholder: "যেমন: ডেলিভারি বাইক চার্জ",
    duration: "সময়কাল",
    minutesShort: "মিনিট",
    powerNeed: "বিদ্যুতের ধরন",
    grid: "গ্রিড বিদ্যুৎ",
    generator: "জেনারেটর",
    none: "বিদ্যুৎ লাগে না",
    powerHintGrid: "বিভ্রাটের সময় এড়িয়ে চলে।",
    powerHintGenerator: "বিভ্রাটের সময়কে অগ্রাধিকার দেয়।",
    powerHintNone: "বিভ্রাটের সময়ও করা যায়।",
    addJob: "কাজ যোগ করুন",
    nameRequired: "কাজটির একটি নাম দিন।",
    durationInvalid: "১ থেকে ১,৪৪০-এর মধ্যে পূর্ণ মিনিট লিখুন।",
    timeInvalid: "২৪ ঘণ্টার হিসাবে সঠিক সময় লিখুন।",
    sameTime: "শুরু ও শেষের সময় আলাদা হতে হবে।",
    timelineTitle: "আজকের পরিকল্পনা",
    timelineNote: "বিভ্রাট ও কাজ একই ২৪ ঘণ্টার মাপে দেখানো হয়েছে।",
    outageLane: "বিদ্যুৎ বিভ্রাট",
    workLane: "কাজের পরিকল্পনা",
    availableAllDay: "সারাদিন গ্রিড বিদ্যুৎ আছে",
    emptyTimeline: "দিনের পরিকল্পনা বানাতে একটি কাজ যোগ করুন।",
    queueTitle: "কাজের তথ্য",
    queueNote: "এই কাজগুলো থেকেই পরিকল্পনা তৈরি হয়। তথ্য বদলালেই হিসাব নতুন হবে।",
    removeJob: "কাজ মুছুন",
    emptyQueue: "এখনও কোনো কাজ নেই। পাশের প্যানেল থেকে প্রথম কাজটি যোগ করুন।",
    scheduleTitle: "পরিকল্পিত কাজ",
    scheduleNote: "দীর্ঘ গ্রিডের কাজ আগে জায়গা পায়। জেনারেটর ও বিদ্যুৎহীন কাজ বিভ্রাটের সময়কে অগ্রাধিকার দেয়।",
    time: "সময়",
    job: "কাজ",
    source: "বিদ্যুৎ",
    noPlan: "কাজ যোগ করলে পরিকল্পিত কাজ এখানে দেখা যাবে।",
    unplacedTitle: "মনোযোগ প্রয়োজন",
    noGridWindow: "কাজটির জন্য টানা গ্রিড বিদ্যুতের সময় নেই।",
    dayFull: "কাজটি রাত ২৪:০০-এর আগে শেষ করা সম্ভব নয়।",
    invalidDuration: "সময়কাল ১ থেকে ১,৪৪০-এর মধ্যে পূর্ণ মিনিট হতে হবে।",
    saved: "এই ব্রাউজারে সংরক্ষিত",
    storageUnavailable: "ব্রাউজারে সংরক্ষণ করা যাচ্ছে না",
    localNote: "কোনো অ্যাকাউন্ট, API বা সরকারি বিভ্রাটের দাবি নেই। পরিকল্পনা এই ডিভাইসেই থাকে।",
    outageDetail: "{start} থেকে {end} পর্যন্ত বিদ্যুৎ বিভ্রাট",
    windowRemoved: "বিভ্রাটের সময় মুছে ফেলা হয়েছে।",
    jobRemoved: "কাজ মুছে ফেলা হয়েছে।",
    demoLoaded: "ডেমো পরিকল্পনা চালু হয়েছে।",
    undo: "ফিরিয়ে আনুন",
    restored: "পরিবর্তন ফিরিয়ে আনা হয়েছে।",
    adjustmentHint: "সময়কাল কমান অথবা বিদ্যুতের ধরন বদলান।",
    howTitle: "কাজচলে যেভাবে সিদ্ধান্ত নেয়",
    howBody: "প্রথমে সবচেয়ে কঠিন শর্তের কাজ বসে। এরপর গ্রিড ছাড়াই চলতে পারে এমন কাজ দিয়ে বিভ্রাটের সময় ব্যবহার করা হয়।",
    ruleGrid: "গ্রিডের কাজ কখনো বিভ্রাটের সঙ্গে মিলবে না।",
    ruleGenerator: "জেনারেটরের কাজ মোট জেনারেটর মিনিটে যোগ হয়।",
    ruleNone: "বিদ্যুৎহীন কাজ বিভ্রাটের সময় শক্তি খরচ ছাড়াই চলতে পারে।",
    jobAdded: "কাজ যোগ হয়েছে এবং পরিকল্পনা নতুন করে তৈরি হয়েছে।",
  },
} as const;

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function powerLabel(powerNeed: PowerNeed, text: (typeof copy)[Locale]): string {
  if (powerNeed === "grid") return text.grid;
  if (powerNeed === "generator") return text.generator;
  return text.none;
}

function powerHint(powerNeed: PowerNeed, text: (typeof copy)[Locale]): string {
  if (powerNeed === "grid") return text.powerHintGrid;
  if (powerNeed === "generator") return text.powerHintGenerator;
  return text.powerHintNone;
}

function unplacedReason(job: UnplacedJob, text: (typeof copy)[Locale]): string {
  if (job.reason === "no_grid_window") return text.noGridWindow;
  if (job.reason === "day_full") return text.dayFull;
  return text.invalidDuration;
}

function outageDetail(
  start: number,
  end: number,
  text: (typeof copy)[Locale],
): string {
  return text.outageDetail
    .replace("{start}", minuteToTime(start))
    .replace("{end}", minuteToTime(end));
}

function TimelineBar({ job }: { job: PlannedJob }) {
  const left = `${(job.start / MINUTES_PER_DAY) * 100}%`;
  const width = `${((job.end - job.start) / MINUTES_PER_DAY) * 100}%`;
  const detail = `${job.name}: ${minuteToTime(job.start)} to ${minuteToTime(job.end)}`;
  return (
    <div
      className={`job-bar job-bar--${job.powerNeed}`}
      style={{ left, width }}
      title={detail}
      role="img"
      aria-label={detail}
    >
      <span>{job.name}</span>
    </div>
  );
}

export function PlannerApp() {
  const [locale, setLocale] = useState<Locale>("en");
  const [windows, setWindows] = useState<OutageWindow[]>(SAMPLE_STATE.windows);
  const [jobs, setJobs] = useState<Job[]>(SAMPLE_STATE.jobs);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("60");
  const [newPowerNeed, setNewPowerNeed] = useState<PowerNeed>("grid");
  const [formError, setFormError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const text = copy[locale];

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseStoredState(stored);
        if (parsed) {
          setWindows(parsed.windows);
          setJobs(parsed.jobs);
        } else {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            setStorageAvailable(false);
          }
        }
      }
    } catch {
      setStorageAvailable(false);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage is optional. Keep the planner usable in memory.
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ windows, jobs }));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [hydrated, jobs, windows]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const plan = useMemo(() => buildDayPlan(windows, jobs), [jobs, windows]);
  const invalidWindowCount = windows.filter((window) => windowError(window)).length;
  const hourMarks = Array.from({ length: 13 }, (_, index) => index * 2);

  function addWindow() {
    setUndoState(null);
    const lastEnd = windows.at(-1)?.end ?? "12:00";
    const [hour] = lastEnd.split(":").map(Number);
    const nextHour = Number.isFinite(hour) ? (hour + 1) % 24 : 13;
    setWindows((current) => [
      ...current,
      {
        id: newId("outage"),
        start: lastEnd,
        end: `${String(nextHour).padStart(2, "0")}:00`,
      },
    ]);
  }

  function updateWindow(id: string, field: "start" | "end", value: string) {
    setUndoState(null);
    setWindows((current) =>
      current.map((window) => (window.id === id ? { ...window, [field]: value } : window)),
    );
  }

  function removeWindow(window: OutageWindow) {
    setUndoState({ windows: windows.map((item) => ({ ...item })), jobs, message: text.windowRemoved });
    setWindows((current) => current.filter((item) => item.id !== window.id));
    setAnnouncement(text.windowRemoved);
  }

  function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    const duration = Number(newDuration);
    if (!name) {
      setFormError(text.nameRequired);
      return;
    }
    if (!isValidDuration(duration)) {
      setFormError(text.durationInvalid);
      return;
    }
    setJobs((current) => [
      ...current,
      { id: newId("job"), name, duration, powerNeed: newPowerNeed },
    ]);
    setUndoState(null);
    setNewName("");
    setFormError(null);
    setAnnouncement(text.jobAdded);
  }

  function updateJob(id: string, patch: Partial<Job>) {
    setUndoState(null);
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  function removeJob(job: Job) {
    setUndoState({ windows, jobs: jobs.map((item) => ({ ...item })), message: text.jobRemoved });
    setJobs((current) => current.filter((item) => item.id !== job.id));
    setAnnouncement(text.jobRemoved);
  }

  function loadDemo() {
    const changed =
      JSON.stringify({ windows, jobs }) !== JSON.stringify(SAMPLE_STATE);
    if (changed) {
      setUndoState({
        windows: windows.map((window) => ({ ...window })),
        jobs: jobs.map((job) => ({ ...job })),
        message: text.demoLoaded,
      });
    } else {
      setUndoState(null);
    }
    setWindows(SAMPLE_STATE.windows.map((window) => ({ ...window })));
    setJobs(SAMPLE_STATE.jobs.map((job) => ({ ...job })));
    setFormError(null);
    setAnnouncement(text.demoLoaded);
  }

  function restorePrevious() {
    if (!undoState) return;
    setWindows(undoState.windows.map((window) => ({ ...window })));
    setJobs(undoState.jobs.map((job) => ({ ...job })));
    setUndoState(null);
    setAnnouncement(text.restored);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#planner">
        {text.skip}
      </a>

      <header className="site-header">
        <div className="brand-lockup" aria-label={`${text.product} ${text.productBn}`}>
          <span className="brand-mark" aria-hidden="true">KC</span>
          <span className="brand-copy">
            <strong>{text.product}</strong>
            <small>{text.productBn}</small>
          </span>
        </div>
        <span className="header-descriptor">{text.descriptor}</span>
        <div className="header-actions">
          <button className="button button--quiet" type="button" onClick={loadDemo}>
            {text.reset}
          </button>
          <button
            className="language-button"
            type="button"
            onClick={() => {
              setLocale((current) => (current === "en" ? "bn" : "en"));
              setAnnouncement("");
            }}
            aria-label={`Switch language to ${text.language}`}
          >
            {text.language}
          </button>
        </div>
      </header>

      {undoState ? (
        <div className="undo-toast" role="status">
          <span>{undoState.message}</span>
          <button className="text-button" type="button" onClick={restorePrevious}>
            {text.undo}
          </button>
        </div>
      ) : null}

      <main id="planner">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <h1 id="page-title">{text.title}</h1>
            <p className="intro-text">{text.intro}</p>
          </div>
          <div className={`plan-snapshot${plan.unplaced.length ? " plan-snapshot--attention" : ""}`} aria-label={text.planSummary}>
            <div className="snapshot-status" aria-live="polite">
              <span className="snapshot-status__mark" aria-hidden="true" />
              <div>
                <strong>{plan.unplaced.length ? text.planNeedsAttention : text.planReady}</strong>
                <span>{plan.planned.length} / {jobs.length} {text.jobsScheduled}</span>
              </div>
            </div>
            <div className="snapshot-stats">
              <div className="snapshot-stat">
                <strong>{plan.generatorMinutes}</strong>
                <span>{text.generatorMetric}</span>
              </div>
              <div className="snapshot-stat">
                <strong>{plan.outageIntervals.length}</strong>
                <span>{invalidWindowCount ? `${invalidWindowCount} ${text.invalid}` : text.cutsMetric}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="workspace">
          <aside className="setup-panel" aria-labelledby="setup-title">
            <div className="panel-heading">
              <h2 id="setup-title">{text.setup}</h2>
              <p>{text.setupNote}</p>
            </div>

            <section className="control-section" aria-labelledby="outage-title">
              <div className="control-heading">
                <h3 id="outage-title">{text.outageTitle}</h3>
                <button className="text-button" type="button" onClick={addWindow}>
                  {text.addWindow}
                </button>
              </div>
              <div className="window-list">
                {windows.map((window, index) => {
                  const rawError = windowError(window);
                  const error = rawError
                    ? rawError.includes("different")
                      ? text.sameTime
                      : text.timeInvalid
                    : null;
                  return (
                    <div className={`window-editor${error ? " window-editor--error" : ""}`} key={window.id}>
                      <span className="item-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <label>
                        <span>{text.start}</span>
                        <input
                          type="time"
                          value={window.start}
                          aria-invalid={Boolean(error) || undefined}
                          aria-describedby={error ? `window-error-${window.id}` : undefined}
                          onChange={(event) => updateWindow(window.id, "start", event.target.value)}
                        />
                      </label>
                      <label>
                        <span>{text.end}</span>
                        <input
                          type="time"
                          value={window.end}
                          aria-invalid={Boolean(error) || undefined}
                          aria-describedby={error ? `window-error-${window.id}` : undefined}
                          onChange={(event) => updateWindow(window.id, "end", event.target.value)}
                        />
                      </label>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`${text.removeWindow} ${index + 1}`}
                        onClick={() => removeWindow(window)}
                      >
                        ×
                      </button>
                      {error ? (
                        <p className="field-error" id={`window-error-${window.id}`}>
                          {error}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {windows.length === 0 ? <p className="empty-note">{text.noWindows}</p> : null}
              </div>
            </section>

            <section className="control-section" aria-labelledby="new-job-title">
              <h3 id="new-job-title">{text.newJob}</h3>
              <form className="job-form" onSubmit={submitJob} noValidate>
                <label className="field field--wide">
                  <span>{text.jobName}</span>
                  <input
                    type="text"
                    value={newName}
                    placeholder={text.jobNamePlaceholder}
                    maxLength={80}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{text.duration}</span>
                  <div className="number-field">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max={MINUTES_PER_DAY}
                      step="1"
                      value={newDuration}
                      onChange={(event) => setNewDuration(event.target.value)}
                    />
                    <span>{text.minutesShort}</span>
                  </div>
                </label>
                <label className="field">
                  <span>{text.powerNeed}</span>
                  <select
                    value={newPowerNeed}
                    onChange={(event) => setNewPowerNeed(event.target.value as PowerNeed)}
                  >
                    <option value="grid">{text.grid}</option>
                    <option value="generator">{text.generator}</option>
                    <option value="none">{text.none}</option>
                  </select>
                  <span className="field-hint">{powerHint(newPowerNeed, text)}</span>
                </label>
                {formError ? <p className="form-error" role="alert">{formError}</p> : null}
                <button className="button button--primary" type="submit">
                  {text.addJob}
                </button>
              </form>
            </section>
          </aside>

          <div className="plan-column">
            <section className="timeline-panel" aria-labelledby="timeline-title">
              <div className="panel-heading panel-heading--row">
                <div>
                  <h2 id="timeline-title">{text.timelineTitle}</h2>
                  <p>{text.timelineNote}</p>
                </div>
                <div className="legend" aria-label={text.timelineLegend}>
                  <span className="legend-item legend-item--cut">{text.outageLane}</span>
                  <span className="legend-item legend-item--grid">{text.grid}</span>
                  <span className="legend-item legend-item--generator">{text.generator}</span>
                  <span className="legend-item legend-item--none">{text.none}</span>
                </div>
              </div>
              <div className="timeline-scroll" tabIndex={0} aria-label={text.scrollableTimeline}>
                <div className="timeline">
                  <div className="time-axis" aria-hidden="true">
                    {hourMarks.map((hour) => (
                      <span key={hour} style={{ left: `${(hour / 24) * 100}%` }}>
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                  <div className="lane lane--outages">
                    <span className="lane-label">{text.outageLane}</span>
                    <div className="lane-track">
                      {plan.outageIntervals.map((interval) => (
                        <div
                          className="outage-bar"
                          key={`${interval.start}-${interval.end}`}
                          style={{
                            left: `${(interval.start / MINUTES_PER_DAY) * 100}%`,
                            width: `${((interval.end - interval.start) / MINUTES_PER_DAY) * 100}%`,
                          }}
                          title={outageDetail(interval.start, interval.end, text)}
                          role="img"
                          aria-label={outageDetail(interval.start, interval.end, text)}
                        />
                      ))}
                      {plan.outageIntervals.length === 0 ? (
                        <span className="lane-empty">{text.availableAllDay}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="lane lane--jobs">
                    <span className="lane-label">{text.workLane}</span>
                    <div className="lane-track lane-track--jobs">
                      {plan.planned.map((job) => <TimelineBar job={job} key={job.id} />)}
                      {plan.planned.length === 0 ? (
                        <span className="lane-empty">{text.emptyTimeline}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="queue-panel" aria-labelledby="queue-title">
              <div className="panel-heading panel-heading--row">
                <div>
                  <h2 id="queue-title">{text.queueTitle}</h2>
                  <p>{text.queueNote}</p>
                </div>
                <span className="saved-state">
                  {storageAvailable ? text.saved : text.storageUnavailable}
                </span>
              </div>
              {jobs.length ? (
                <div className="job-edit-list">
                  {jobs.map((job, index) => {
                    const nameError = !job.name.trim();
                    const durationError = !isValidDuration(job.duration);
                    return (
                      <div className="job-editor" key={job.id}>
                        <span className={`power-key power-key--${job.powerNeed}`} aria-hidden="true" />
                        <span className="item-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <label className="sr-only" htmlFor={`job-name-${job.id}`}>{text.jobName}</label>
                        <input
                          id={`job-name-${job.id}`}
                          className="job-editor__name"
                          type="text"
                          maxLength={80}
                          value={job.name}
                          aria-invalid={nameError || undefined}
                          aria-describedby={nameError ? `job-name-error-${job.id}` : undefined}
                          onChange={(event) => updateJob(job.id, { name: event.target.value })}
                        />
                        <label className="sr-only" htmlFor={`job-duration-${job.id}`}>{text.duration}</label>
                        <div className="job-editor__duration">
                          <input
                            id={`job-duration-${job.id}`}
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max={MINUTES_PER_DAY}
                            step="1"
                            value={Number.isFinite(job.duration) ? job.duration : ""}
                            aria-invalid={durationError || undefined}
                            aria-describedby={durationError ? `job-duration-error-${job.id}` : undefined}
                            onChange={(event) => updateJob(job.id, { duration: Number(event.target.value) })}
                          />
                          <span>{text.minutesShort}</span>
                        </div>
                        <label className="sr-only" htmlFor={`job-power-${job.id}`}>{text.powerNeed}</label>
                        <select
                          id={`job-power-${job.id}`}
                          value={job.powerNeed}
                          onChange={(event) => updateJob(job.id, { powerNeed: event.target.value as PowerNeed })}
                        >
                          <option value="grid">{text.grid}</option>
                          <option value="generator">{text.generator}</option>
                          <option value="none">{text.none}</option>
                        </select>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`${text.removeJob}: ${job.name || text.job}`}
                          onClick={() => removeJob(job)}
                        >
                          ×
                        </button>
                        {nameError ? (
                          <p className="job-editor__error" id={`job-name-error-${job.id}`}>
                            {text.nameRequired}
                          </p>
                        ) : null}
                        {durationError ? (
                          <p className="job-editor__error" id={`job-duration-error-${job.id}`}>
                            {text.durationInvalid}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-note empty-note--large">{text.emptyQueue}</p>
              )}
            </section>
          </div>
        </div>

        <section className="results-grid" aria-label={text.scheduleResults}>
          <div className="schedule-panel">
            <div className="panel-heading">
              <h2>{text.scheduleTitle}</h2>
              <p>{text.scheduleNote}</p>
            </div>
            {plan.planned.length ? (
              <div className="schedule-table" role="table" aria-label={text.scheduleTitle}>
                <div className="schedule-row schedule-row--head" role="row">
                  <span role="columnheader">{text.time}</span>
                  <span role="columnheader">{text.job}</span>
                  <span role="columnheader">{text.source}</span>
                  <span role="columnheader">{text.duration}</span>
                </div>
                {plan.planned.map((job) => (
                  <div className="schedule-row" role="row" key={job.id}>
                    <strong role="cell">{minuteToTime(job.start)} - {minuteToTime(job.end)}</strong>
                    <span role="cell">{job.name || text.job}</span>
                    <span role="cell" className={`source-label source-label--${job.powerNeed}`}>
                      {powerLabel(job.powerNeed, text)}
                    </span>
                    <span role="cell">{job.duration} {text.minutesShort}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-note empty-note--large">{text.noPlan}</p>
            )}
          </div>

          <aside className="decision-panel" aria-labelledby="method-title">
            {plan.unplaced.length ? (
              <div className="attention-block" role="alert">
                <h2>{text.unplacedTitle}</h2>
                {plan.unplaced.map((job) => (
                  <div className="attention-item" key={job.id}>
                    <strong>{job.name || text.job}</strong>
                    <span>{unplacedReason(job, text)}</span>
                    <small>{text.adjustmentHint}</small>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="method-block">
              <h2 id="method-title">{text.howTitle}</h2>
              <p>{text.howBody}</p>
              <ol>
                <li>{text.ruleGrid}</li>
                <li>{text.ruleGenerator}</li>
                <li>{text.ruleNone}</li>
              </ol>
            </div>
          </aside>
        </section>

        <footer className="site-footer">
          <strong>{text.product} / {text.productBn}</strong>
          <p>{text.localNote}</p>
        </footer>
      </main>

      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
