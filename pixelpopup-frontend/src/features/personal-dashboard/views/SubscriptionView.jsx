import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { ArrowLeft, ChevronDown, Download, Info, Plus, Receipt, Settings2 } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useRecords } from "../hooks/useDashboardData";
import { EmptyState, ErrorState, Panel, LoadingState } from "../components/Panel";
import SummaryTiles from "../components/SummaryTiles";
import SelectableField from "../components/SelectableField";
import ServiceTable, { Pagination, StatusBadge } from "../components/subscriptions/ServiceTable";
import BillingHistory from "../components/subscriptions/BillingHistory";
import UtilityOverview from "../components/subscriptions/UtilityOverview";
import ReadingHistory from "../components/subscriptions/ReadingHistory";
import SubscriptionAnalytics from "../components/subscriptions/SubscriptionAnalytics";
import SubscriptionSettings from "../components/subscriptions/SubscriptionSettings";
import ApplianceList from "../components/subscriptions/ApplianceList";
import SubscriptionForm from "../components/subscriptions/forms/SubscriptionForm";
import SubscriptionPaymentForm from "../components/subscriptions/forms/SubscriptionPaymentForm";
import ConfirmBillForm from "../components/subscriptions/forms/ConfirmBillForm";
import CyclePeriodForm from "../components/subscriptions/forms/CyclePeriodForm";
import TariffForm from "../components/subscriptions/forms/TariffForm";
import MeterForm from "../components/subscriptions/forms/MeterForm";
import MeterReadingForm from "../components/subscriptions/forms/MeterReadingForm";
import MeterEventForm from "../components/subscriptions/forms/MeterEventForm";
import ApplianceForm from "../components/subscriptions/forms/ApplianceForm";
import LifecycleForm from "../components/subscriptions/forms/LifecycleForm";
import PriceForm from "../components/subscriptions/forms/PriceForm";
import { servicePath, downloadExport } from "../subscriptions/api";
import { meteredTypes, option, serviceTypes, titleCase } from "../subscriptions/model";
import { dateLabel, money } from "../lib/format";

function EventHistory({ service, dashboard }) {
  const [page, setPage] = useState(1);
  const result = useRecords(servicePath(service.id, `history/?page=${page}`), dashboard.request, dashboard.version);
  return <Panel title="Service history" description="Read-only record of configuration, readings, actual bills and payments.">{result.loading ? <LoadingState message="Loading history…" /> : result.error ? <ErrorState message={result.error} retry={dashboard.refresh} /> : <><ServiceTable rows={result.data.results} columns={[{ key: "effective_date", label: "Effective date" }, { key: "kind", label: "Change", render: (r) => titleCase(r.kind) }, { key: "after", label: "Details", render: (r) => <details><summary className="cursor-pointer text-blue-700">Before / after</summary><pre className="mt-2 max-h-48 max-w-sm overflow-auto text-xs">{JSON.stringify({ before: r.before, after: r.after }, null, 2)}</pre></details> }]} /><Pagination page={page} setPage={setPage} data={result.data} /></>}</Panel>;
}

export default function SubscriptionView({ subscriptionId, dashboard, month, notify }) {
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState(null);
  const actionUsed = useRef(false);
  const records = useRecords(servicePath(subscriptionId), dashboard.request, dashboard.version);
  const service = records.data;
  const cycleId = params.get("cycle") || service?.current_cycle?.id;
  const cycleResult = useRecords(servicePath(subscriptionId, `cycles/${cycleId || 0}/`), dashboard.request, dashboard.version);
  const cycle = cycleResult.data;
  const selectedTab = params.get("view") || "overview";
  const setParam = (key, value) => setParams((old) => { const next = new URLSearchParams(old); value ? next.set(key, value) : next.delete(key); return next; });
  useEffect(() => {
    if (!cycle || !service || actionUsed.current || params.get("action") !== "pay") return;
    actionUsed.current = true;
    setDialog({ kind: cycle.bill_amount == null ? "confirm" : "payment", service, cycle });
  }, [cycle, service, params]);
  const close = () => { setDialog(null); if (params.has("action")) setParam("action", ""); };
  if (records.loading) return <LoadingState message="Loading subscription…" />;
  if (records.error) return <ErrorState message={records.error} retry={dashboard.refresh} />;
  if (!service) return <EmptyState title="Service not found" />;
  const metered = meteredTypes.has(service.service_type);
  const Icon = serviceTypes.find((t) => t.value === service.service_type)?.icon || Receipt;
  const open = (kind, record) => setDialog({ kind, record, service, cycle });
  // Freeze the revision opened by the user; background refresh must not approve a stale draft.
  const formProps = { service: dialog?.service || service, cycle: dialog?.cycle || cycle, dashboard, notify, onSaved: close, onCancel: close };
  const cycleChoices = [...service.cycles];
  if (cycle && !cycleChoices.some((c) => c.id === cycle.id)) cycleChoices.push(cycle);
  const menuItem = "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-800";
  return <div className="space-y-5">
    <Link className="inline-flex items-center gap-2 py-1 text-sm text-slate-600 hover:text-blue-700" to={`/dashboard/bills?section=subscriptions&month=${month}`}><ArrowLeft size={15} />Subscriptions & utilities</Link>
    <Panel title={<span className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon size={21} /></span><span>{service.title}<span className="ml-3 inline-block align-middle"><StatusBadge status={service.archived ? "archived" : service.status} /></span></span></span>} description={[service.provider, service.plan_name, `PHP · Every ${service.interval} ${service.frequency}`].filter(Boolean).join(" · ")} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadExport(dashboard, servicePath(service.id, "export/?kind=cycles")).catch((e) => notify(e.message, { tone: "error" }))}><Download size={15} />Export</Button><DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="outline"><Settings2 size={15} />Actions<ChevronDown size={15} /></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 min-w-52 rounded-md border bg-white p-1 shadow-md"><DropdownMenu.Item className={menuItem} onSelect={() => open("edit")}>Edit service</DropdownMenu.Item>{!service.variable_amount && <DropdownMenu.Item className={menuItem} onSelect={() => open("price")}>Record price change</DropdownMenu.Item>}{metered && <><DropdownMenu.Item className={menuItem} onSelect={() => open("meter")}>Add meter</DropdownMenu.Item><DropdownMenu.Item className={menuItem} onSelect={() => open("tariff")}>Add rate version</DropdownMenu.Item></>}{[service.status === "active" ? "pause" : "resume", "cancel", service.archived ? "restore" : "archive"].map((action) => <DropdownMenu.Item key={action} className={menuItem} onSelect={() => open(action)}>{titleCase(action)}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div>}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="w-full sm:max-w-sm"><SelectableField label="Selected billing period" value={String(cycleId || "")} onChange={(v) => { setParam("cycle", v); setDialog(null); }} options={cycleChoices.map((c) => option(c.id, `${dateLabel(c.due_date)} · ${c.excluded ? "excluded" : c.status}`))} /></div>{cycle && !cycle.excluded && <div className="flex flex-wrap justify-end gap-2">{metered && <Button variant="outline" onClick={() => open("period")}>Set period / rate</Button>}<Button variant="outline" onClick={() => open("confirm")}>Confirm actual bill</Button><Button disabled={cycle.remaining == null || Number(cycle.remaining) <= 0} onClick={() => open("payment")}><Plus size={15} />Record payment</Button></div>}</div>
      {cycle?.excluded && <p className="mt-3 flex gap-2 text-sm text-slate-600"><Info size={16} />This period is excluded: {cycle.exclusion_reason}. No payment can be posted here.</p>}
      {cycleResult.error && cycleId && <ErrorState message={cycleResult.error} retry={dashboard.refresh} />}
      {cycle?.needs_review && <ErrorState message="The saved paid state and payment history disagree. Review the original bill and ledger before confirming a correction; another payment is blocked to avoid paying twice." />}
    </Panel>
    <Tabs value={selectedTab} onValueChange={(v) => setParam("view", v)} className="gap-5"><TabsList aria-label="Service sections" className="h-auto w-full flex-wrap justify-start sm:w-fit">{[["overview", "Overview"], ...(metered ? [["readings", "Readings"]] : []), ["billing", "Billing & payments"], ...(!service.variable_amount ? [["prices", "Price history"]] : []), ...(service.service_type === "electricity" ? [["appliances", "Appliances"]] : []), ["settings", "Settings"], ["history", "History"]].map(([key, label]) => <TabsTrigger key={key} value={key} className="px-3 py-2">{label}</TabsTrigger>)}</TabsList>
      <TabsContent value="overview" className="space-y-5">
        {cycleResult.loading ? <LoadingState message="Loading selected period…" /> : cycle && (metered ? <UtilityOverview cycle={cycle} service={service} dashboard={dashboard} /> : <SummaryTiles items={[{ label: "Bill amount", value: cycle.bill_amount == null ? "Confirm actual bill" : money(cycle.bill_amount), icon: "deadline" }, { label: "Paid for this bill", value: money(cycle.paid), icon: "expenses" }, { label: "Remaining", value: cycle.remaining == null ? "Unknown" : money(cycle.remaining), icon: "balance" }, { label: "Monthly fixed equivalent", value: service.monthly_equivalent == null ? "Variable bill" : money(service.monthly_equivalent), icon: "budget", hint: "Planning only, not another monthly charge." }]} />)}
        {cycle && <Panel title="Selected billing period"><ServiceTable rows={[cycle]} columns={[{ key: "due_date", label: "Due date" }, { key: "status", label: "State", render: (r) => <StatusBadge status={r.status} /> }, { key: "actual_amount", label: "Confirmed actual", render: (r) => r.actual_amount == null ? "Not confirmed" : money(r.actual_amount) }, { key: "period_start", label: "Consumption start" }, { key: "period_end", label: "End (exclusive)" }]} /></Panel>}
        <SubscriptionAnalytics service={service} dashboard={dashboard} month={month} />
      </TabsContent>
      {metered && <TabsContent value="readings" className="space-y-5"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => downloadExport(dashboard, servicePath(service.id, "export/?kind=readings")).catch((e) => notify(e.message, { tone: "error" }))}><Download size={15} />Export readings</Button><Button onClick={() => open("meter")}><Plus size={15} />Add meter</Button></div>{service.meters.length ? service.meters.map((meter) => <ReadingHistory key={meter.id} service={service} meter={meter} dashboard={dashboard} open={open} />) : <EmptyState title="No meters yet" message="Add the actual meter and its first reading. No baseline or consumption is assumed." />}</TabsContent>}
      <TabsContent value="billing"><BillingHistory service={service} dashboard={dashboard} chooseCycle={(id) => { setParams((old) => { const next = new URLSearchParams(old); next.set("cycle", id); next.set("view", "overview"); return next; }); }} /></TabsContent>
      <TabsContent value="prices"><Panel title="Fixed price history" action={<Button onClick={() => open("price")}><Plus size={15} />Record price change</Button>}><ServiceTable rows={service.prices} columns={[{ key: "effective_date", label: "Effective from" }, { key: "amount", label: "Renewal price", render: (r) => money(r.amount) }, { key: "imported", label: "Source", render: (r) => r.imported ? "Imported current known price (not historical proof)" : "Recorded price version" }]} /></Panel></TabsContent>
      <TabsContent value="appliances"><ApplianceList service={service} cycle={cycle} dashboard={dashboard} open={open} /></TabsContent>
      <TabsContent value="settings"><SubscriptionSettings service={service} dashboard={dashboard} notify={notify} open={open} /></TabsContent>
      <TabsContent value="history"><EventHistory service={service} dashboard={dashboard} /></TabsContent>
    </Tabs>
    {dialog?.kind === "edit" && <SubscriptionForm {...formProps} record={dialog.service} />}
    {dialog?.kind === "payment" && cycle && <SubscriptionPaymentForm {...formProps} />}
    {dialog?.kind === "confirm" && cycle && <ConfirmBillForm {...formProps} />}
    {dialog?.kind === "period" && cycle && <CyclePeriodForm {...formProps} />}
    {dialog?.kind === "tariff" && <TariffForm {...formProps} />}
    {dialog?.kind === "meter" && <MeterForm {...formProps} record={dialog.record} />}
    {dialog?.kind === "reading" && <MeterReadingForm {...formProps} meter={dialog.record.meter} record={dialog.record.reading} />}
    {dialog?.kind === "meter-event" && <MeterEventForm {...formProps} meter={dialog.record} />}
    {dialog?.kind === "appliance" && <ApplianceForm {...formProps} record={dialog.record} />}
    {dialog?.kind === "price" && <PriceForm {...formProps} />}
    {["pause", "resume", "cancel", "archive", "restore"].includes(dialog?.kind) && <LifecycleForm {...formProps} action={dialog.kind} />}
  </div>;
}
