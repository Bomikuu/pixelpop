import { Bell, Check, Circle, CircleCheck, ExternalLink, Flame, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Progress } from "../../ui/progress";

const titles = { start: "Today's important tasks", strict: "A quick reminder", recap: "Your daily recap", manual: "Important tasks" };

function dayLabel(value) {
  return new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })
    .format(new Date(`${value}T12:00:00+08:00`));
}

function CalorieProgress({ item }) {
  const current = Number(item.calories || 0);
  const target = Number(item.target_kcal || 0);
  return <div className="mt-2 max-w-xs space-y-1.5">
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <Flame size={13} aria-hidden="true" />
      <span>{Math.round(current).toLocaleString()} kcal logged{target > 0 ? ` / ${Math.round(target).toLocaleString()} kcal target` : ""}</span>
    </div>
    {target > 0 && <Progress value={Math.min(100, current / target * 100)} aria-label="Food calorie intake toward daily target" />}
  </div>;
}

export default function ReminderChecklistDialog({ dialog, error, busy, close, toggle }) {
  if (!dialog) return null;
  const { checklist, phase } = dialog;
  const done = checklist.items.filter((item) => item.completed).length;
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="personal-dashboard max-h-[88dvh] overflow-y-auto bg-white sm:max-w-xl motion-reduce:transition-none">
      <DialogHeader className="pr-8">
        <DialogTitle className="flex items-center gap-2 text-slate-950">
          {phase === "recap" ? <ListChecks size={19} aria-hidden="true" /> : <Bell size={19} aria-hidden="true" />}
          {titles[phase] || titles.manual}
        </DialogTitle>
        <DialogDescription>{dayLabel(checklist.date)} · Completed tasks stay in the list.</DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">{done} of {checklist.items.length} done</span>
        {checklist.all_complete && <span className="inline-flex items-center gap-1.5 text-emerald-700"><CircleCheck size={16} aria-hidden="true" /> All done—nice work!</span>}
      </div>
      <Progress value={checklist.items.length ? done / checklist.items.length * 100 : 0} aria-label="Important task completion" />
      {checklist.items.length ? <ul className="divide-y divide-slate-200 border-y border-slate-200">
        {checklist.items.map((item) => <li key={item.deadline_id} className="flex items-start gap-3 py-3">
          {item.automatic ? <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${item.completed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`} aria-hidden="true">
            {item.completed ? <Check size={15} /> : <Circle size={15} />}
          </span> : <button type="button" disabled={busy} onClick={() => toggle(item.deadline_id)} aria-pressed={item.completed} aria-label={`${item.completed ? "Mark incomplete" : "Mark complete"}: ${item.title}`} className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] motion-reduce:transition-none ${item.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-600 hover:border-[var(--pd-primary)] hover:text-[var(--pd-primary)]"}`}>
            {item.completed ? <Check size={15} /> : <Circle size={15} />}
          </button>}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${item.completed ? "text-slate-500 line-through decoration-slate-400" : "text-slate-950"}`}>{item.title}</p>
            <p className="mt-0.5 text-xs text-slate-600">{item.completed ? "Completed" : item.automatic ? "Complete by logging an entry" : "Still to do"}</p>
            {item.source === "calories" && <CalorieProgress item={item} />}
          </div>
          <Button asChild variant="ghost" size="icon-sm" className="shrink-0" title={`Open ${item.title}`}>
            <Link to={item.action_url} onClick={close} aria-label={`Open ${item.title}`}><ExternalLink size={15} aria-hidden="true" /></Link>
          </Button>
        </li>)}
      </ul> : <div className="grid place-items-center gap-2 py-8 text-center text-slate-600"><ListChecks size={30} aria-hidden="true" /><p>No important tasks for this day.</p></div>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <DialogFooter><Button variant="outline" onClick={close}>Done</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
