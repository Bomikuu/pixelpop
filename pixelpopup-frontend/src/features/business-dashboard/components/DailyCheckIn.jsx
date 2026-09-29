import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, CheckCircle2, CircleAlert, Save, UserRoundCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { allRecords, leadershipApi } from "../api";
import { checkInProgress, checkInQuestions } from "../progress";
import { Button } from "../../personal-dashboard/ui/button";
import { Input } from "../../personal-dashboard/ui/input";
import { ErrorState, Panel } from "../../personal-dashboard/components/Panel";

const emptyAnswers = () => Object.fromEntries(checkInQuestions.map(([key]) => [key, ""]));
const manilaToday = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};
const answersFrom = (record) => Object.fromEntries(checkInQuestions.map(([key]) => [key, record?.[key] || ""]));
const formatDay = (day) => new Intl.DateTimeFormat("en-PH", { timeZone: "UTC", dateStyle: "medium" }).format(new Date(`${day}T12:00:00Z`));

export default function DailyCheckIn({ csrf, notify, memberId, showHistory = false }) {
  const navigate = useNavigate();
  const [today, setToday] = useState(manilaToday);
  const [day, setDay] = useState(manilaToday);
  const [member, setMember] = useState(memberId ? { id: memberId } : null);
  const [memberReady, setMemberReady] = useState(Boolean(memberId));
  const [record, setRecord] = useState(null);
  const [answers, setAnswers] = useState(emptyAnswers);
  const [history, setHistory] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = manilaToday();
      setToday((old) => {
        if (old !== next) setDay((selected) => selected === old ? next : selected);
        return next;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (memberId) { setMember({ id: memberId }); setMemberReady(true); return; }
    let active = true;
    allRecords("team-members", csrf).then((data) => {
      if (active) setMember(data.find((person) => person.is_self) || null);
    }).catch((cause) => { if (active) setError(cause.message); }).finally(() => { if (active) { setMemberReady(true); setLoading(false); } });
    return () => { active = false; };
  }, [csrf, memberId, revision]);

  const load = useCallback(async () => {
    if (!member?.id) { if (memberReady) setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [dayData, historyData] = await Promise.all([
        leadershipApi(`daily-check-ins/?member=${member.id}&date=${day}&page_size=1`, {}, csrf),
        showHistory ? leadershipApi(`daily-check-ins/?member=${member.id}&page_size=10`, {}, csrf) : Promise.resolve(null),
      ]);
      const saved = dayData.results?.[0] || null;
      setRecord(saved);
      setAnswers(answersFrom(saved));
      if (historyData) { setHistory(historyData.results || []); setNextPage(historyData.next ? 2 : null); }
    } catch (cause) { setError(cause.message); }
    finally { setLoading(false); }
  }, [member?.id, memberReady, day, csrf, showHistory]);
  useEffect(() => { load(); }, [load, revision]);

  const save = async () => {
    if (day > today) { setSaveError("Choose today or an earlier Manila date."); return; }
    setSaving(true); setSaveError("");
    try {
      const saved = await leadershipApi("daily-check-ins/day/", { method: "PUT", body: { member: member.id, date: day, ...answers } }, csrf);
      setRecord(saved);
      notify?.("Daily check-in saved.");
      setRevision((old) => old + 1);
    } catch (cause) { setSaveError(cause.message); }
    finally { setSaving(false); }
  };
  const loadMore = async () => {
    if (!nextPage) return;
    try {
      const data = await leadershipApi(`daily-check-ins/?member=${member.id}&page_size=10&page=${nextPage}`, {}, csrf);
      setHistory((old) => [...old, ...(data.results || [])]);
      setNextPage(data.next ? nextPage + 1 : null);
    } catch (cause) { setError(cause.message); }
  };

  const progress = checkInProgress(answers);
  const savedProgress = record ? checkInProgress(record) : null;
  const hasUnsavedChanges = record && checkInQuestions.some(([key]) => answers[key] !== (record[key] || ""));
  return <Panel title="End-of-day check-in" description="A fresh checklist each Manila day. Record what happened; this is not a performance score.">
    {error ? <ErrorState message={error} retry={() => setRevision((old) => old + 1)} /> : loading || !memberReady ? <div className="h-32 animate-pulse rounded-md bg-slate-100" aria-busy="true"/> : !member ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><p className="flex items-center gap-2"><UserRoundCheck size={18} aria-hidden="true"/> Mark a team member as “This is me” to start your check-in.</p><Button variant="outline" onClick={() => navigate("/business/team")}>Open Team Development</Button></div> : <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label htmlFor="check-in-day" className="flex items-center gap-2 text-sm font-medium text-slate-800"><CalendarDays size={16} aria-hidden="true"/> Check-in date</label><Input id="check-in-day" type="date" max={today} value={day} onChange={(event) => { setDay(event.target.value); setSaveError(""); }} className="w-auto bg-white"/></div>
      <div className="divide-y rounded-md border bg-white">{checkInQuestions.map(([key, question]) => <fieldset key={key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"><legend className="sr-only">{question}</legend><span className="text-sm font-medium text-slate-800" aria-hidden="true">{question}</span><div className="flex flex-wrap gap-1" aria-label={question}>{[["done", "Done"], ["not_done", "Not done"], ["not_applicable", "Not applicable"]].map(([value, label]) => <button key={value} type="button" aria-pressed={answers[key] === value} onClick={() => setAnswers((old) => ({ ...old, [key]: old[key] === value ? "" : value }))} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${answers[key] === value ? value === "done" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : value === "not_done" ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-300 bg-slate-100 text-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{answers[key] === value && <Check size={12} className="mr-1 inline" aria-hidden="true"/>}{label}</button>)}</div></fieldset>)}</div>
      <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm ${!hasUnsavedChanges && savedProgress?.complete ? "border-emerald-200 bg-emerald-50 text-emerald-900" : !hasUnsavedChanges && record && !savedProgress?.noApplicable ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-800"}`}><p className="flex items-center gap-2">{!hasUnsavedChanges && savedProgress?.complete ? <CheckCircle2 size={17} aria-hidden="true"/> : !hasUnsavedChanges && record && !savedProgress?.noApplicable ? <CircleAlert size={17} aria-hidden="true"/> : <CalendarDays size={17} aria-hidden="true"/>}<span>{hasUnsavedChanges ? "Unsaved changes — save to update this day." : savedProgress?.complete ? "Good work today — you closed the loop." : savedProgress?.noApplicable ? "No applicable items recorded." : record && day !== today ? "A few things are still open — choose what to improve tomorrow." : record ? "A few things are still open — keep going." : "Choose your answers, then save your check-in."}</span></p><span className="tabular-nums">{progress.done} / {progress.applicable} applicable done</span></div>
      {saveError && <p role="alert" className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{saveError} Your choices are still here; please try again.</p>}
      <div className="mt-4 flex justify-end"><Button onClick={save} disabled={saving || !day || day > today}><Save size={16} aria-hidden="true"/>{saving ? "Saving…" : "Save check-in"}</Button></div>
      {showHistory && <div className="mt-6 border-t pt-4"><h3 className="text-sm font-semibold text-slate-950">Check-in history</h3>{history.length ? <div className="mt-3 divide-y rounded-md border bg-white">{history.map((entry) => { const result = checkInProgress(entry); return <button key={entry.id} type="button" onClick={() => setDay(entry.date)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-blue-600"><span className="font-medium text-slate-800">{formatDay(entry.date)}</span><span className={`flex items-center gap-1.5 rounded-md border px-2 py-1 ${result.complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : result.noApplicable ? "border-slate-200 bg-slate-50 text-slate-600" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{result.complete ? <CheckCircle2 size={16} aria-hidden="true"/> : <CircleAlert size={16} aria-hidden="true"/>}{result.noApplicable ? "No applicable items" : `${result.done}/${result.applicable} done`}</span></button>; })}</div> : <p className="mt-2 text-sm text-slate-600">No saved check-ins yet.</p>}{nextPage && <Button variant="outline" size="sm" className="mt-3" onClick={loadMore}>Load older check-ins</Button>}</div>}
    </>}
  </Panel>;
}
