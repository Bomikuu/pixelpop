import { CalendarDays, ChevronLeft, ChevronRight, Check, ClipboardCopy, FileText, ListChecks, ListTodo, MessageSquareText, Pencil, Plus } from "lucide-react";
import { Button } from "../../ui/button";

const status = { workday: "Workday", day_off: "Day off", vacation: "Vacation", holiday: "Holiday" };
const fullDate = (value) => new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));

function CopyAction({ title, text, onCopy, copied }) {
  return <Button type="button" size="sm" variant="outline" disabled={!text} onClick={() => onCopy(text, title)} aria-label={`Copy ${title.toLowerCase()}`}>
    {copied === title ? <Check size={14} aria-hidden="true" /> : <ClipboardCopy size={14} aria-hidden="true" />}
    {copied === title ? "Copied" : "Copy"}
  </Button>;
}

function DetailSection({ icon: Icon, title, text, onCopy, copied, children }) {
  return <section className="border border-[var(--pd-border)] bg-white p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><Icon size={17} className="text-slate-700" aria-hidden="true" />{title}</h3>
      <CopyAction title={title} text={text} onCopy={onCopy} copied={copied} />
    </div>
    {children}
  </section>;
}

export default function EodDetail({ date, entry, groupName, onEdit, onAdd, onCopy, copied, detailRef, onPrevious, onNext }) {
  const bullets = entry?.items?.length ? entry.items : entry?.bullet_list || [];
  const bulletText = bullets.map((item) => `• ${item}`).join("\n");
  const inProgress = entry?.in_progress || [];
  const inProgressText = inProgress.map((item) => `• ${item}`).join("\n");

  return <section id="eod-detail" data-eod-detail className="min-w-0 border border-[var(--pd-border)] bg-white p-4 lg:sticky lg:top-4 lg:self-start" aria-live="polite">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 ref={detailRef} tabIndex={-1} className="text-lg font-semibold text-slate-950 outline-none scroll-mt-4">{fullDate(date)}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><CalendarDays size={14} aria-hidden="true" />{groupName || "Personal"}{entry && <> / {status[entry.type] || "Workday"}</>}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon" variant="outline" disabled={!onPrevious} onClick={onPrevious} aria-label="Previous day"><ChevronLeft size={16} aria-hidden="true" /></Button>
        <Button type="button" size="icon" variant="outline" disabled={!onNext} onClick={onNext} aria-label="Next day"><ChevronRight size={16} aria-hidden="true" /></Button>
      </div>
    </div>

    {!entry ? <div className="mt-5 border border-dashed border-[var(--pd-border)] bg-white px-4 py-10 text-center">
      <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-blue-50 text-blue-700"><CalendarDays size={21} aria-hidden="true" /></span>
      <h3 className="text-sm font-semibold text-slate-950">No entry for this day</h3>
      <p className="mx-auto mt-1 max-w-64 text-sm leading-6 text-slate-600">This date is ready for a recap when you are.</p>
      <Button type="button" size="sm" className="mt-4" onClick={onAdd}><Plus size={15} aria-hidden="true" />Add entry</Button>
    </div> : <>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pd-border)] pb-4">
        <h3 className="min-w-0 flex-1 text-base font-semibold text-slate-950">{entry.title}</h3>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}><Pencil size={14} aria-hidden="true" />Edit</Button>
      </div>
      {entry.type === "workday" ? <div className="mt-4 space-y-3">
        <DetailSection icon={FileText} title="Daily summary" text={entry.summary || ""} onCopy={onCopy} copied={copied}>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{entry.summary}</p>
        </DetailSection>
        <DetailSection icon={MessageSquareText} title="Slack-ready message" text={entry.outputs?.slack_message || ""} onCopy={onCopy} copied={copied}>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words bg-slate-50 p-3 font-sans text-sm leading-6 text-slate-700">{entry.outputs?.slack_message || ""}</pre>
        </DetailSection>
        <DetailSection icon={ListChecks} title="Bullet list" text={bulletText} onCopy={onCopy} copied={copied}>
          {bullets.length ? <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{bullets.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="text-sm text-slate-600">No completed items logged.</p>}
        </DetailSection>
        <DetailSection icon={ListTodo} title="In progress" text={inProgressText} onCopy={onCopy} copied={copied}>
          {inProgress.length ? <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">{inProgress.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="text-sm text-slate-600">No items in progress.</p>}
        </DetailSection>
      </div> : <div className="mt-4 border border-[var(--pd-border)] bg-white p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{entry.summary || "No note added for this day."}</p></div>}
    </>}
  </section>;
}
