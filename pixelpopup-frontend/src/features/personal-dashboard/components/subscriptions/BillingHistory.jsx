import { useState } from "react";
import { Button } from "../../ui/button";
import { useRecords } from "../../hooks/useDashboardData";
import { ErrorState, Panel } from "../Panel";
import ServiceTable, { Pagination, StatusBadge } from "./ServiceTable";
import MoneyFlowAmount from "../MoneyFlowAmount";
import { servicePath } from "../../subscriptions/api";
import { money, dateLabel } from "../../lib/format";

export default function BillingHistory({ service, dashboard, chooseCycle }) {
  const [page, setPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const records = useRecords(servicePath(service.id, `cycles/?page=${page}`), dashboard.request, dashboard.version);
  const payments = useRecords(servicePath(service.id, `payments/?page=${paymentsPage}`), dashboard.request, dashboard.version);
  return <div className="space-y-5"><Panel title="Billing periods" description="Actual bills, paid allocations and remaining balances are distinct. Select a period to review or pay it.">
    {records.loading ? <p role="status">Loading billing history…</p> : records.error ? <ErrorState message={records.error} retry={dashboard.refresh} /> : <><ServiceTable rows={records.data.results} columns={[{ key: "due_date", label: "Due date", render: (r) => <Button variant="link" onClick={() => chooseCycle(r.id)}>{dateLabel(r.due_date)}</Button> }, { key: "period", label: "Consumption dates", render: (r) => r.period_start ? `${r.period_start} – ${r.period_end} (exclusive)` : "Not configured" }, { key: "bill_amount", label: "Bill", render: (r) => r.bill_amount == null ? "Not confirmed" : money(r.bill_amount) }, { key: "paid", label: "Paid", render: (r) => <MoneyFlowAmount amount={r.paid} direction="out" /> }, { key: "remaining", label: "Remaining", render: (r) => r.remaining == null ? "Unknown" : money(r.remaining) }, { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> }]} /><Pagination page={page} data={records.data} setPage={setPage} /></>}
  </Panel><Panel title="Actual payments" description="Each allocation is an existing ledger expense, not an additional charge.">{payments.loading ? <p role="status">Loading payments…</p> : payments.error ? <ErrorState message={payments.error} retry={dashboard.refresh} /> : <><ServiceTable rows={payments.data.results} columns={[{ key: "transaction__date", label: "Paid on" }, { key: "transaction__name", label: "Expense" }, { key: "transaction__account__name", label: "Account" }, { key: "transaction__amount", label: "Amount", render: (r) => <MoneyFlowAmount amount={r.transaction__amount} direction="out" /> }]} /><Pagination page={paymentsPage} data={payments.data} setPage={setPaymentsPage} /></>}</Panel></div>;
}
