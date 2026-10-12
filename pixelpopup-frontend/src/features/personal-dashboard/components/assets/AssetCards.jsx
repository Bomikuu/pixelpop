import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { ArrowRight, CalendarDays, CircleCheck, FileText, Landmark, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { assetTypes, choiceIcon } from "../../lib/presets";
import { dateLabel, money } from "../../lib/format";
import AssetImage from "./AssetImage";
import AssetFinancingDialog from "../AssetFinancingDialog";

function AssetCard({ asset, month, openForm, confirmDelete, dashboard, notify }) {
  const Icon = choiceIcon(asset.kind);
  const type = assetTypes.find(([value]) => value === asset.kind)?.[1] || "Other";
  const progress = asset.financing_progress;
  const hasFinancing = !!(asset.financing_id || progress);
  const completeProgress = Number.isInteger(progress?.paid) && Number.isInteger(progress?.total) && progress.total > 0 && progress.paid >= 0 && progress.paid <= progress.total;
  const percent = completeProgress ? Math.round(progress.paid / progress.total * 100) : 0;
  const remaining = completeProgress ? progress.total - progress.paid : 0;
  const home = ["house", "condo", "land"].includes(asset.kind);
  const tone = home ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";
  const detailUrl = `/dashboard/assets/${asset.id}?month=${month}`;
  const [financingOpen, setFinancingOpen] = useState(false);
  const financingTrigger = useRef(null);
  const trigger = useRef(null);
  const opening = useRef(false);
  function select(action) {
    opening.current = true;
    trigger.current?.focus();
    action();
  }
  return <li className="group min-w-0 rounded-xl border border-[var(--pd-border)] bg-white p-4 transition-colors hover:border-blue-300 motion-reduce:transition-none sm:p-5">
    <div className="relative grid grid-cols-2 items-center gap-x-4 gap-y-5">
      <div className="col-span-2 flex min-w-0 items-start gap-3 pr-12 sm:col-span-1 sm:pr-0">
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tone}`}><Icon className="size-6" aria-hidden="true" /></span>
        <div className="min-w-0"><h3 className="break-words text-base font-semibold text-slate-950">{asset.name}</h3>
          <Badge variant="secondary" className={`mt-1.5 ${home ? "bg-emerald-50 text-emerald-700" : "text-slate-600"}`}>{type}</Badge>
          {!asset.active && <Badge variant="outline" className="ml-2">Archived</Badge>}
        </div>
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild><Button ref={trigger} type="button" variant="outline" size="icon" className="absolute right-0 top-0 z-10 size-11" aria-label={`Actions for ${asset.name}`}><MoreVertical className="size-4" aria-hidden="true" /></Button></DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-[90] min-w-48 rounded-md border border-[var(--pd-border)] bg-white p-1 shadow-lg" onCloseAutoFocus={(event) => { if (opening.current) { event.preventDefault(); opening.current = false; } }}>
            <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]" onSelect={() => select(() => openForm("asset", asset))}><Pencil className="size-4" aria-hidden="true" />Edit asset</DropdownMenu.Item>
            {asset.active && <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-red-700 outline-none data-[highlighted]:bg-red-50" onSelect={() => select(() => confirmDelete("assets", asset))}><Trash2 className="size-4" aria-hidden="true" />Archive asset</DropdownMenu.Item>}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div className="col-start-1"><p className="text-sm text-slate-600">Current value</p><p className="mt-1 break-words text-2xl font-semibold tracking-tight tabular-nums text-slate-950 xl:text-3xl">{money(asset.value)}</p></div>
      <AssetImage src={asset.image_url} name={asset.name} kind={asset.kind} variant="silhouette" className="col-start-2 aspect-[3/2] w-full self-end rounded-lg sm:row-span-2 sm:row-start-1 sm:mt-8" />
    </div>
    <div className="mt-4 border-t border-[var(--pd-border)] pt-4">
      {progress?.paid_off === true ? <p className="flex items-center gap-2 py-3 text-sm text-emerald-700"><CircleCheck className="size-5" aria-hidden="true" />Fully owned</p> : hasFinancing && completeProgress ? <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-medium text-slate-950"><Landmark className="size-5 text-slate-500" aria-hidden="true" />{type} financing</p>{typeof progress.overdue === "boolean" && <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs ${progress.overdue ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}><span className={`size-1.5 rounded-full ${progress.overdue ? "bg-red-600" : "bg-emerald-600"}`} aria-hidden="true" />{progress.overdue ? "Overdue" : "On track"}</span>}</div>
        <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium text-slate-950">{progress.paid} of {progress.total} payments</span><span className="text-slate-600">{remaining} payments to go</span></div>
        <div className="flex items-center gap-3"><Progress value={percent} aria-label={`${asset.name} installment progress`} aria-valuetext={`${progress.paid} of ${progress.total} tracked installments paid`} className={`h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:motion-reduce:transition-none ${progress.overdue ? "[&_[data-slot=progress-indicator]]:bg-red-600" : "[&_[data-slot=progress-indicator]]:bg-emerald-600"}`} /><span className="text-sm tabular-nums text-slate-600">{percent}%</span></div>
      </div> : hasFinancing ? <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span className="text-slate-600">Payment details incomplete</span><Button asChild variant="outline" size="sm" className="min-h-11"><Link to={detailUrl}>Complete details</Link></Button></div> : <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500"><FileText className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-950">No financing linked</p><p className="mt-1 text-xs text-slate-600">Track payments and see progress.</p></div>
        {asset.active && <Button ref={financingTrigger} type="button" variant="outline" size="sm" className="min-h-11 text-[var(--pd-primary)]" onClick={() => setFinancingOpen(true)}><Plus className="size-4" aria-hidden="true" />Add financing</Button>}
      </div>}
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pd-border)] pt-3">
      <div className="flex items-center gap-3"><CalendarDays className="size-5 text-slate-500" aria-hidden="true" /><div><p className="text-xs text-slate-600">Last valuation</p><p className="mt-0.5 text-sm text-slate-950">{dateLabel(asset.valuation_date)}</p></div></div>
      <div className="flex items-center gap-2"><Button asChild variant="outline" size="sm" className="min-h-11 text-[var(--pd-primary)]"><Link to={detailUrl}><ArrowRight className="size-4" aria-hidden="true" />View asset</Link></Button>{asset.active && <Button type="button" variant="outline" size="icon" className="size-11" aria-label={`Edit ${asset.name}`} onClick={() => openForm("asset", asset)}><Pencil className="size-4" aria-hidden="true" /></Button>}</div>
    </div>
    {financingOpen && <AssetFinancingDialog asset={asset} mode="setup" mutate={dashboard.mutate} notify={notify} close={() => { setFinancingOpen(false); requestAnimationFrame(() => (financingTrigger.current || trigger.current)?.focus()); }} />}
  </li>;
}

export default function AssetCards({ rows, ...actions }) {
  return <ul className="grid items-start gap-4 xl:grid-cols-2">{rows.map((asset) => <AssetCard key={asset.id} asset={asset} {...actions} />)}</ul>;
}
