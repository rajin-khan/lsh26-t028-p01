"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  buildDayPlan,
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

const copy = {
  en: {
    skip: "Skip to planner",
    product: "KajChole",
    productBn: "কাজচলে",
    descriptor: "Load-shedding work planner",
    language: "বাংলা",
    reset: "Load demo",
    kicker: "A working day, rebuilt around the grid",
    title: "Power goes. Work stays on plan.",
    intro: "Enter today's cuts and jobs. KajChole builds a conflict-free day and counts every generator minute.",
    generatorMetric: "Generator minutes",
    generatorNote: "Updates with every job change",
    plannedMetric: "Jobs placed",
    cutsMetric: "Power cuts",
    total: "total",
    map24: "24-hour map",
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
    addJob: "Add job",
    nameRequired: "Give the job a name.",
    durationInvalid: "Use a whole number from 1 to 1,440.",
    timeInvalid: "Use a valid 24-hour time.",
    sameTime: "Start and end times must be different.",
    timelineTitle: "Today's power map",
    timelineNote: "Cuts and planned jobs share the same 24-hour scale.",
    outageLane: "Power cuts",
    workLane: "Work plan",
    availableAllDay: "Grid available all day",
    emptyTimeline: "Add a job to build the day plan.",
    queueTitle: "Job queue",
    queueNote: "Edit any field and the plan recalculates immediately.",
    removeJob: "Remove job",
    emptyQueue: "No jobs yet. Add the first job from the setup panel.",
    scheduleTitle: "Completed plan",
    scheduleNote: "Longer grid jobs are protected first. Generator and no-power jobs prefer cut windows.",
    time: "Time",
    job: "Job",
    source: "Power",
    noPlan: "The completed plan appears here after you add a job.",
    unplacedTitle: "Needs attention",
    noGridWindow: "No continuous grid-powered slot is long enough.",
    dayFull: "The job cannot fit before 24:00.",
    invalidDuration: "The duration must be a whole number from 1 to 1,440.",
    saved: "Saved in this browser",
    localNote: "No account, API, or official outage claim. Your plan stays on this device.",
    howTitle: "How KajChole decides",
    howBody: "It schedules the hardest constraint first, then fills outage time with work that can continue without the grid.",
    ruleGrid: "Grid jobs never overlap a cut.",
    ruleGenerator: "Generator jobs count toward generator minutes.",
    ruleNone: "No-power jobs can use cut time at no energy cost.",
    demoLoaded: "Demo plan loaded.",
    jobAdded: "Job added and plan recalculated.",
  },
  bn: {
    skip: "পরিকল্পনায় যান",
    product: "KajChole",
    productBn: "কাজচলে",
    descriptor: "লোডশেডিং কাজের পরিকল্পনা",
    language: "English",
    reset: "ডেমো দেখুন",
    kicker: "বিদ্যুতের সময় ধরে সাজানো কর্মদিবস",
    title: "বিদ্যুৎ গেলেও, কাজ থাকে পরিকল্পনায়।",
    intro: "আজকের বিদ্যুৎ বিভ্রাট ও কাজ লিখুন। কাজচলে সংঘর্ষহীন সময়সূচি বানিয়ে জেনারেটরের মোট সময় হিসাব করবে।",
    generatorMetric: "জেনারেটরের মিনিট",
    generatorNote: "কাজ বদলালেই হিসাব বদলায়",
    plannedMetric: "পরিকল্পিত কাজ",
    cutsMetric: "বিদ্যুৎ বিভ্রাট",
    total: "মোট",
    map24: "২৪ ঘণ্টার মানচিত্র",
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
    addJob: "কাজ যোগ করুন",
    nameRequired: "কাজটির একটি নাম দিন।",
    durationInvalid: "১ থেকে ১,৪৪০-এর মধ্যে পূর্ণ মিনিট লিখুন।",
    timeInvalid: "২৪ ঘণ্টার হিসাবে সঠিক সময় লিখুন।",
    sameTime: "শুরু ও শেষের সময় আলাদা হতে হবে।",
    timelineTitle: "আজকের বিদ্যুৎ মানচিত্র",
    timelineNote: "বিভ্রাট ও কাজ একই ২৪ ঘণ্টার মাপে দেখানো হয়েছে।",
    outageLane: "বিদ্যুৎ বিভ্রাট",
    workLane: "কাজের পরিকল্পনা",
    availableAllDay: "সারাদিন গ্রিড বিদ্যুৎ আছে",
    emptyTimeline: "দিনের পরিকল্পনা বানাতে একটি কাজ যোগ করুন।",
    queueTitle: "কাজের তালিকা",
    queueNote: "যেকোনো তথ্য বদলালে পরিকল্পনা সঙ্গে সঙ্গে নতুন করে তৈরি হবে।",
    removeJob: "কাজ মুছুন",
    emptyQueue: "এখনও কোনো কাজ নেই। পাশের প্যানেল থেকে প্রথম কাজটি যোগ করুন।",
    scheduleTitle: "সম্পূর্ণ পরিকল্পনা",
    scheduleNote: "দীর্ঘ গ্রিডের কাজ আগে জায়গা পায়। জেনারেটর ও বিদ্যুৎহীন কাজ বিভ্রাটের সময়কে অগ্রাধিকার দেয়।",
    time: "সময়",
    job: "কাজ",
    source: "বিদ্যুৎ",
    noPlan: "কাজ যোগ করলে সম্পূর্ণ পরিকল্পনা এখানে দেখা যাবে।",
    unplacedTitle: "মনোযোগ প্রয়োজন",
    noGridWindow: "কাজটির জন্য টানা গ্রিড বিদ্যুতের সময় নেই।",
    dayFull: "কাজটি রাত ২৪:০০-এর আগে শেষ করা সম্ভব নয়।",
    invalidDuration: "সময়কাল ১ থেকে ১,৪৪০-এর মধ্যে পূর্ণ মিনিট হতে হবে।",
    saved: "এই ব্রাউজারে সংরক্ষিত",
    localNote: "কোনো অ্যাকাউন্ট, API বা সরকারি বিভ্রাটের দাবি নেই। পরিকল্পনা এই ডিভাইসেই থাকে।",
    howTitle: "কাজচলে যেভাবে সিদ্ধান্ত নেয়",
    howBody: "প্রথমে সবচেয়ে কঠিন শর্তের কাজ বসে। এরপর গ্রিড ছাড়াই চলতে পারে এমন কাজ দিয়ে বিভ্রাটের সময় ব্যবহার করা হয়।",
    ruleGrid: "গ্রিডের কাজ কখনো বিভ্রাটের সঙ্গে মিলবে না।",
    ruleGenerator: "জেনারেটরের কাজ মোট জেনারেটর মিনিটে যোগ হয়।",
    ruleNone: "বিদ্যুৎহীন কাজ বিভ্রাটের সময় শক্তি খরচ ছাড়াই চলতে পারে।",
    demoLoaded: "ডেমো পরিকল্পনা চালু হয়েছে।",
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

function unplacedReason(job: UnplacedJob, text: (typeof copy)[Locale]): string {
  if (job.reason === "no_grid_window") return text.noGridWindow;
  if (job.reason === "day_full") return text.dayFull;
  return text.invalidDuration;
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
  const text = copy[locale];

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PlannerState>;
        if (Array.isArray(parsed.windows) && Array.isArray(parsed.jobs)) {
          setWindows(parsed.windows);
          setJobs(parsed.jobs);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ windows, jobs }));
  }, [hydrated, jobs, windows]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const plan = useMemo(() => buildDayPlan(windows, jobs), [jobs, windows]);
  const invalidWindowCount = windows.filter((window) => windowError(window)).length;
  const hourMarks = Array.from({ length: 13 }, (_, index) => index * 2);

  function addWindow() {
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
    setWindows((current) =>
      current.map((window) => (window.id === id ? { ...window, [field]: value } : window)),
    );
  }

  function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    const duration = Number(newDuration);
    if (!name) {
      setFormError(text.nameRequired);
      return;
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > MINUTES_PER_DAY) {
      setFormError(text.durationInvalid);
      return;
    }
    setJobs((current) => [
      ...current,
      { id: newId("job"), name, duration, powerNeed: newPowerNeed },
    ]);
    setNewName("");
    setFormError(null);
    setAnnouncement(text.jobAdded);
  }

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  function loadDemo() {
    setWindows(SAMPLE_STATE.windows.map((window) => ({ ...window })));
    setJobs(SAMPLE_STATE.jobs.map((job) => ({ ...job })));
    setFormError(null);
    setAnnouncement(text.demoLoaded);
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
            onClick={() => setLocale((current) => (current === "en" ? "bn" : "en"))}
            aria-label={`Switch language to ${text.language}`}
          >
            {text.language}
          </button>
        </div>
      </header>

      <main id="planner">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="kicker">{text.kicker}</p>
            <h1 id="page-title">{text.title}</h1>
            <p className="intro-text">{text.intro}</p>
          </div>
          <div className="metrics" aria-label="Plan summary">
            <div className="metric metric--primary" aria-live="polite">
              <span>{text.generatorMetric}</span>
              <strong>{plan.generatorMinutes}</strong>
              <small>{text.generatorNote}</small>
            </div>
            <div className="metric">
              <span>{text.plannedMetric}</span>
              <strong>{plan.planned.length}</strong>
              <small>{jobs.length} {text.total}</small>
            </div>
            <div className="metric">
              <span>{text.cutsMetric}</span>
              <strong>{plan.outageIntervals.length}</strong>
              <small>{invalidWindowCount ? `${invalidWindowCount} ${text.invalid}` : text.map24}</small>
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
                          onChange={(event) => updateWindow(window.id, "start", event.target.value)}
                        />
                      </label>
                      <label>
                        <span>{text.end}</span>
                        <input
                          type="time"
                          value={window.end}
                          onChange={(event) => updateWindow(window.id, "end", event.target.value)}
                        />
                      </label>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`${text.removeWindow} ${index + 1}`}
                        onClick={() => setWindows((current) => current.filter((item) => item.id !== window.id))}
                      >
                        ×
                      </button>
                      {error ? <p className="field-error">{error}</p> : null}
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
                <div className="legend" aria-label="Timeline legend">
                  <span className="legend-item legend-item--cut">{text.outageLane}</span>
                  <span className="legend-item legend-item--grid">{text.grid}</span>
                  <span className="legend-item legend-item--generator">{text.generator}</span>
                  <span className="legend-item legend-item--none">{text.none}</span>
                </div>
              </div>
              <div className="timeline-scroll" tabIndex={0} aria-label="Scrollable 24-hour timeline">
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
                          title={`${minuteToTime(interval.start)} to ${minuteToTime(interval.end)}`}
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
                <span className="saved-state">{text.saved}</span>
              </div>
              {jobs.length ? (
                <div className="job-edit-list">
                  {jobs.map((job, index) => (
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
                          value={job.duration || ""}
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
                        aria-label={`${text.removeJob}: ${job.name}`}
                        onClick={() => setJobs((current) => current.filter((item) => item.id !== job.id))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-note empty-note--large">{text.emptyQueue}</p>
              )}
            </section>
          </div>
        </div>

        <section className="results-grid" aria-label="Schedule results">
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
