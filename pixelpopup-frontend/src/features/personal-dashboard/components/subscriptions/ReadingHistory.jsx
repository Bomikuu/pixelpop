import { useState } from "react";
import { Pencil, Plus, Settings2 } from "lucide-react";
import { Button } from "../../ui/button";
import { useRecords } from "../../hooks/useDashboardData";
import { ErrorState, Panel } from "../Panel";
import ServiceTable, { Pagination } from "./ServiceTable";
import { servicePath } from "../../subscriptions/api";
import { money } from "../../lib/format";

export default function ReadingHistory({ service, meter, dashboard, open }) {
  const [page, setPage] = useState(1);
  const records = useRecords(servicePath(service.id, `meters/${meter.id}/readings/?page=${page}`), dashboard.request, dashboard.version);
  return <Panel title={`${meter.name} · ${meter.unit}`} description={meter.active ? "Active meter. Interval costs exclude fixed cycle fees." : "Inactive meter · history retained."} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => open("meter", meter)}><Settings2 size={15} />Meter</Button><Button variant="outline" onClick={() => open("meter-event", meter)}>Reset / replace</Button><Button onClick={() => open("reading", { meter })}><Plus size={15} />Add reading</Button></div>}>
    {records.loading ? <p role="status">Loading readings…</p> : records.error ? <ErrorState message={records.error} retry={dashboard.refresh} /> : <><ServiceTable rows={records.data.results} columns={[{ key: "recorded_at", label: "Date / time (Manila)", render: (r) => new Date(r.recorded_at).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) }, { key: "value", label: `Reading (${meter.unit})` }, { key: "consumption", label: "Since previous", render: (r) => r.consumption == null ? "No comparable baseline" : `${Number(r.consumption).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${meter.unit}` }, { key: "usage_cost", label: "Usage-only estimate", render: (r) => r.usage_cost == null ? "Rate unavailable" : money(r.usage_cost) }, { key: "note", label: "Note" }, { key: "actions", label: "Correct", render: (r) => <Button variant="ghost" size="icon" aria-label={`Correct reading from ${r.recorded_at}`} onClick={() => open("reading", { meter, reading: r })}><Pencil size={15} /></Button> }]} /><Pagination page={page} data={records.data} setPage={setPage} /></>}
  </Panel>;
}
