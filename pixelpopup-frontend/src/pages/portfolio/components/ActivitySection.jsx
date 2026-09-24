import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bot, Github } from "lucide-react";
import { getGithubActivity } from "../api/portfolioApi";
import codexActivity from "../data/codexActivity.json";
import Reveal from "./Reveal";

const CURRENT_YEAR = new Date().getUTCFullYear();
const GITHUB_YEARS = Array.from({ length: 4 }, (_, index) => CURRENT_YEAR - index);
const CODEX_YEARS = Object.keys(codexActivity.years).map(Number).sort((a, b) => b - a);
const CELL_COLORS = ["#e8eef6", "#c4d7f5", "#8cb2ef", "#4f86e5", "#245cc7"];
const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

function dateLabel(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
}

function buildWeeks(year) {
  const first = new Date(Date.UTC(year, 0, 1));
  first.setUTCDate(first.getUTCDate() - first.getUTCDay());
  const last = new Date(Date.UTC(year, 11, 31));
  last.setUTCDate(last.getUTCDate() + 6 - last.getUTCDay());

  const weeks = [];
  const monthLabels = [];
  for (let cursor = new Date(first); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    const week = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = new Date(cursor);
      day.setUTCDate(day.getUTCDate() + weekday);
      const date = day.toISOString().slice(0, 10);
      week.push({ date, inYear: day.getUTCFullYear() === year });
      if (day.getUTCFullYear() === year && day.getUTCDate() === 1) {
        monthLabels.push({ label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(day), column: weeks.length + 1 });
      }
    }
    weeks.push(week);
  }
  return { weeks, monthLabels };
}

function longestStreak(days) {
  let longest = 0;
  let current = 0;
  let previousDate = null;
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (day.count > 0) {
      const previousDay = new Date(`${day.date}T00:00:00Z`);
      previousDay.setUTCDate(previousDay.getUTCDate() - 1);
      current = previousDate === previousDay.toISOString().slice(0, 10) ? current + 1 : 1;
      previousDate = day.date;
    } else {
      current = 0;
      previousDate = null;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}

function levelForCount(count, source) {
  if (!count) return 0;
  if (source === "codex") return Math.min(count, 4);
  if (count < 3) return 1;
  if (count < 7) return 2;
  if (count < 13) return 3;
  return 4;
}

function ActivityCalendar({ year, days, source, firstTrackedDate }) {
  const { weeks, monthLabels } = useMemo(() => buildWeeks(year), [year]);
  const counts = useMemo(() => new Map(days.map((day) => [day.date, day.count])), [days]);
  const today = new Date().toISOString().slice(0, 10);
  const isCodex = source === "codex";
  const activeDays = days.filter((day) => day.count > 0).length;

  return (
    <div>
      <div className="overflow-x-auto pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff]" tabIndex={0} aria-label={`${year} ${isCodex ? "Codex task" : "GitHub contribution"} calendar; scroll horizontally to see all months`}>
        <div className="w-max min-w-full">
          <div className="ml-9 grid h-7 items-start gap-1 text-[0.68rem] font-semibold text-[#64748b]" style={{ gridTemplateColumns: `repeat(${weeks.length}, 12px)` }} aria-hidden="true">
            {monthLabels.map((month) => (
              <span key={`${month.label}-${month.column}`} style={{ gridColumnStart: month.column }}>{month.label}</span>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="grid w-6 grid-rows-7 gap-1 text-[0.65rem] leading-3 text-[#64748b]" aria-hidden="true">
              <span /><span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span />
            </div>
            <div className="flex gap-1" role="img" aria-label={`${activeDays} active days shown in ${year}. ${isCodex ? "Codex tasks touched" : "GitHub contributions"} are grouped by day.`}>
              {weeks.map((week, index) => (
                <div key={index} className="grid grid-rows-7 gap-1">
                  {week.map(({ date, inYear }) => {
                    const tracked = !isCodex || (firstTrackedDate && date >= firstTrackedDate);
                    const visible = inYear && date <= today;
                    const count = counts.get(date) ?? 0;
                    const level = levelForCount(count, source);
                    return (
                      <span
                        key={date}
                        className={`size-3 rounded-[2px] ${visible && !tracked ? "bg-[#f3f6fa]" : ""}`}
                        style={visible && tracked ? { backgroundColor: CELL_COLORS[level] } : undefined}
                        title={visible && tracked ? `${dateLabel(date)}: ${count} ${isCodex ? "tasks touched" : "contributions"}` : undefined}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#dce5f0] pt-4 text-xs text-[#64748b]">
        <span>{isCodex ? `Tracking begins ${dateLabel(firstTrackedDate)}; earlier days are untracked.` : "Public contributions on GitHub."}</span>
        <div className="flex items-center gap-1.5" aria-label="Activity intensity, from less to more">
          <span className="mr-1">Less</span>
          {CELL_COLORS.map((color) => <span key={color} className="size-3 rounded-[2px]" style={{ backgroundColor: color }} aria-hidden="true" />)}
          <span className="ml-1">More</span>
        </div>
      </div>
      <ul className="sr-only" aria-label={`Active ${isCodex ? "Codex task" : "GitHub contribution"} days in ${year}`}>
        {days.filter((day) => day.count > 0).map((day) => (
          <li key={day.date}>{dateLabel(day.date)}: {day.count} {isCodex ? "tasks touched" : "contributions"}</li>
        ))}
      </ul>
    </div>
  );
}

function ActivityMetrics({ source, year, data }) {
  const days = data.days ?? [];
  const activeDays = days.filter((day) => day.count > 0).length;
  const streak = longestStreak(days);
  const lastActive = [...days].reverse().find((day) => day.count > 0)?.date;
  const metrics = source === "github"
    ? [
      { label: "Contributions", value: NUMBER_FORMAT.format(data.totalContributions ?? 0) },
      { label: "Active days", value: NUMBER_FORMAT.format(activeDays) },
      { label: "Longest streak", value: `${streak} ${streak === 1 ? "day" : "days"}` },
      { label: "Latest contribution", value: lastActive ? dateLabel(lastActive) : "None yet" },
    ]
    : [
      { label: "Tasks worked on", value: NUMBER_FORMAT.format(data.uniqueTasks ?? 0) },
      { label: "Active days", value: NUMBER_FORMAT.format(activeDays) },
      { label: "Longest run", value: `${streak} ${streak === 1 ? "day" : "days"}` },
      { label: "Latest activity", value: lastActive ? dateLabel(lastActive) : "None yet" },
    ];

  return (
    <div className="grid grid-cols-2 border-b border-[#dce5f0] lg:grid-cols-4" aria-label={`${year} activity summary`}>
      {metrics.map((metric, index) => (
        <div key={metric.label} className={`px-5 py-5 sm:px-7 sm:py-6 ${index % 2 ? "border-l border-[#dce5f0]" : ""} ${index > 1 ? "border-t border-[#dce5f0] lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}>
          <span className="block text-xs font-semibold text-[#64748b]">{metric.label}</span>
          <strong className="portfolio-metric-value mt-2 block text-xl font-semibold leading-tight text-[#0b1733] sm:text-2xl">{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function ActivitySection() {
  const [source, setSource] = useState("github");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [githubState, setGithubState] = useState({ status: "idle", year: null, data: null });
  const availableYears = source === "github" ? GITHUB_YEARS : CODEX_YEARS;
  const codexYear = codexActivity.years[String(year)];
  const githubStateIsCurrent = githubState.year === year;
  const data = source === "github" ? (githubStateIsCurrent ? githubState.data : null) : codexYear;

  useEffect(() => {
    if (source !== "github") return undefined;
    const controller = new AbortController();
    setGithubState({ status: "loading", year, data: null });
    getGithubActivity(year, controller.signal)
      .then((result) => setGithubState({ status: "ready", year, data: result }))
      .catch((error) => {
        if (error.name !== "AbortError") setGithubState({ status: "error", year, data: null });
      });
    return () => controller.abort();
  }, [source, year]);

  function selectSource(nextSource) {
    setSource(nextSource);
    setYear(nextSource === "github" ? CURRENT_YEAR : CODEX_YEARS[0] ?? CURRENT_YEAR);
  }

  const loading = source === "github" && (!githubStateIsCurrent || githubState.status === "loading");
  const unavailable = source === "github" && githubStateIsCurrent && githubState.status === "error";
  const empty = source === "codex" && !codexYear;

  return (
    <section className="bg-[#0b1733] py-24 text-white sm:py-32" aria-labelledby="activity-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <header className="grid gap-8 border-b border-white/20 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)] lg:items-end">
            <h2 id="activity-title" className="portfolio-display max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Work, measured <span className="text-[#8db4ff]">over time.</span>
            </h2>
            <p className="max-w-lg text-base leading-7 text-blue-100/75 lg:justify-self-end">Public GitHub contributions and a local snapshot of the Codex tasks behind the work.</p>
          </header>
        </Reveal>

        <Reveal className="mt-10 sm:mt-12">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="inline-flex gap-1 rounded-lg border border-white/20 bg-white/5 p-1" aria-label="Activity source">
              <button type="button" onClick={() => selectSource("github")} aria-pressed={source === "github"} className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${source === "github" ? "bg-[#2f5bff] text-white" : "text-blue-100/75 hover:bg-white/10 hover:text-white"}`}>
                <Github size={17} aria-hidden="true" /> GitHub
              </button>
              <button type="button" onClick={() => selectSource("codex")} aria-pressed={source === "codex"} className={`inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${source === "codex" ? "bg-[#2f5bff] text-white" : "text-blue-100/75 hover:bg-white/10 hover:text-white"}`}>
                <Bot size={17} aria-hidden="true" /> AI usage
              </button>
            </div>
            {source === "github" ? (
              <a href="https://github.com/Bomikuu" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100/80 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                View GitHub profile <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : null}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl bg-white text-[#0b1733]">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-7 sm:px-8 sm:py-8">
              <div aria-live="polite">
                <h3 className="text-xl font-semibold sm:text-2xl">{source === "github" ? "GitHub activity" : "Codex task activity"}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52677d]">
                  {source === "github"
                    ? `Public contributions by Bomikuu in ${year}.`
                    : `Locally recorded Codex tasks in ${year}. Snapshot from ${dateLabel(codexActivity.generatedAt.slice(0, 10))}.`}
                </p>
              </div>
              {source === "codex" && codexActivity.firstTrackedDate ? (
                <span className="rounded-md bg-[#edf5ff] px-3 py-1.5 text-xs font-semibold text-[#245cc7]">Tracked since {dateLabel(codexActivity.firstTrackedDate)}</span>
              ) : null}
            </div>

            {data && !loading ? <ActivityMetrics source={source} year={year} data={data} /> : null}

            <div className="grid lg:grid-cols-[minmax(0,1fr)_6rem]">
              <div className="min-h-64 bg-[#f8fafc] p-5 sm:p-8" aria-live="polite">
                {loading ? (
                  <div className="flex h-48 items-center justify-center text-sm text-[#52677d]">Loading GitHub activity…</div>
                ) : unavailable ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                    <strong className="text-base text-[#0b1733]">GitHub activity is unavailable right now.</strong>
                    <p className="max-w-sm text-sm text-[#52677d]">You can still view the contribution graph on GitHub.</p>
                  </div>
                ) : empty ? (
                  <div className="flex h-48 items-center justify-center text-center text-sm text-[#52677d]">No local Codex task activity has been recorded for this year.</div>
                ) : data ? (
                  <ActivityCalendar year={year} days={data.days} source={source} firstTrackedDate={codexActivity.firstTrackedDate} />
                ) : null}
              </div>
              <nav className="flex gap-1 border-t border-[#dce5f0] bg-white p-3 lg:flex-col lg:border-l lg:border-t-0" aria-label="Activity year">
                {availableYears.map((availableYear) => (
                  <button key={availableYear} type="button" onClick={() => setYear(availableYear)} aria-pressed={availableYear === year} className={`min-h-10 min-w-14 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f5bff] ${availableYear === year ? "bg-[#0b1733] text-white" : "text-[#52677d] hover:bg-[#edf5ff] hover:text-[#245cc7]"}`}>
                    {availableYear}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
