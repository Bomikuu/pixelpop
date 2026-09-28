import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  WalletCards,
  XCircle,
  Receipt,
} from "lucide-react";
import { Panel } from "../Panel";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table";
import { money, dateLabel } from "../../lib/format";
import { initials } from "../../lib/sharedBills";

const colors = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-5)",
];

export default function BillBreakdown({ bill, readOnly = false, actions }) {
  const rows = bill.participants.map((person) => ({
    ...person,
    value: Number(person.share),
  }));
  const allPaid =
    bill.all_paid ||
    (rows.length > 0 &&
      Number(bill.remaining_bill) <= 0 &&
      rows.every(
        (person) =>
          Number(person.remaining) <= 0 &&
          Number(person.refund_due ?? person.to_receive) <= 0,
      ));
  return (
    <div className="space-y-5">
      {readOnly && (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total bill", value: money(bill.total), icon: Receipt },
            {
              label: bill.receiver_id
                ? "Net contributions paid"
                : "Paid to provider",
              value: money(bill.merchant_paid),
              icon: WalletCards,
            },
            {
              label: "Bill still unpaid",
              value: money(bill.remaining_bill),
              icon: Clock,
            },
            {
              label: "Reimbursement owed",
              value: money(bill.reimbursement_due || 0),
              icon: ArrowDownLeft,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="min-w-0 rounded-lg border bg-white p-4 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50/50 motion-reduce:transition-none"
            >
              <dt className="flex items-center gap-2 text-sm text-slate-600">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
                  <Icon size={16} aria-hidden="true" />
                </span>
                {label}
              </dt>
              <dd className="mt-3 break-words text-xl font-semibold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <Panel
        title="Contribution breakdown"
        description="Agreed contributions—not payment status. Fixed amounts are reserved first; the rest is split equally."
        action={actions}
      >
        {allPaid && (
          <p
            role="status"
            className="mb-5 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"
          >
            <CheckCircle2
              className="mt-0.5 shrink-0"
              size={18}
              aria-hidden="true"
            />
            <span>
              <strong>
                {bill.all_paid
                  ? "Event marked all paid."
                  : "Everyone has paid."}
              </strong>{" "}
              {bill.all_paid
                ? "Volunteers covered any unpaid shares; excess was kept with consent. Actual payments remain in history."
                : "No contributions or reimbursements are outstanding."}
            </span>
          </p>
        )}
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
          <div className="mx-auto w-full max-w-xs">
            <div className="h-64" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows}
                    dataKey="value"
                    nameKey="name"
                    outerRadius="90%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="white"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {rows.map((person, index) => (
                      <Cell
                        key={person.id}
                        fill={colors[index % colors.length]}
                        className="cursor-pointer transition-[filter] hover:brightness-110 motion-reduce:transition-none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      money(value) +
                        " · " +
                        (
                          (Number(value) / Number(bill.total)) *
                          100
                        ).toLocaleString("en-PH", {
                          maximumFractionDigits: 1,
                        }) +
                        "%",
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      borderColor: "var(--pd-border)",
                      color: "var(--pd-ink)",
                      fontSize: "0.875rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-600">Total bill</span>
              <span className="mt-1 text-xl font-semibold tabular-nums">
                {money(bill.total)}
              </span>
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Contribution</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Payment status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((person, index) => {
                  const remaining = Number(person.remaining);
                  const advanced = Number(
                    person.refund_due ?? person.to_receive,
                  );
                  const paid = Number(person.paid);
                  const StatusIcon = person.covered_by_group
                    ? CheckCircle2
                    : advanced > 0
                      ? ArrowDownLeft
                      : remaining <= 0
                        ? CheckCircle2
                        : Clock;
                  const status = person.covered_by_group
                    ? "Covered by volunteers"
                    : advanced > 0
                      ? bill.receiver_id
                        ? "Refund owed"
                        : "To receive"
                      : remaining <= 0
                        ? "Paid"
                        : paid > 0
                          ? "Partially paid"
                          : "Unpaid";
                  return (
                    <TableRow
                      key={person.id}
                      className={
                        person.is_me && !readOnly
                          ? "bg-blue-50/80 hover:bg-blue-100/70"
                          : ""
                      }
                    >
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {person.is_me && !readOnly ? (
                            <img
                              src="/portfolio/assets/mico-ang-pixel-portrait.webp"
                              alt=""
                              width={36}
                              height={36}
                              className="size-9 shrink-0 rounded-full border border-blue-200 bg-white object-cover [image-rendering:pixelated]"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-50 text-xs font-semibold"
                              style={{ color: colors[index % colors.length] }}
                            >
                              {initials(person.name)}
                            </span>
                          )}
                          <span className="break-words">
                            <span
                              className={
                                person.is_me && !readOnly
                                  ? "font-semibold text-blue-900"
                                  : ""
                              }
                            >
                              {person.name}
                            </span>
                            {person.is_me && !readOnly && (
                              <Badge
                                variant="outline"
                                className="ml-2 border-blue-200 bg-white text-blue-800"
                              >
                                You
                              </Badge>
                            )}
                            <span className="block text-xs text-slate-500">
                              {person.share_is_fixed
                                ? "Fixed contribution"
                                : "Split remainder"}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {money(person.share)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {(
                          (Number(person.share) / Number(bill.total)) *
                          100
                        ).toLocaleString("en-PH", { maximumFractionDigits: 1 })}
                        %
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            "gap-1.5 " +
                            (remaining <= 0 || person.covered_by_group
                              ? "border-teal-200 bg-teal-50 text-teal-800"
                              : "border-amber-200 bg-amber-50 text-amber-800")
                          }
                        >
                          <StatusIcon size={15} aria-hidden="true" />
                          {status}
                        </Badge>
                        <span className="mt-1 block text-xs text-slate-600 tabular-nums">
                          {person.covered_by_group
                            ? money(paid) + " personally paid"
                            : advanced > 0
                              ? money(advanced) + " to receive"
                              : remaining > 0
                                ? money(remaining) + " left"
                                : money(paid) + " paid"}
                        </span>
                        {Number(person.waived_excess) > 0 && (
                          <span className="mt-1 block text-xs text-slate-600">
                            {money(person.waived_excess)} excess waived
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Panel>
      <Panel
        title={
          <span className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700">
              <WalletCards size={18} aria-hidden="true" />
            </span>
            Payment history
          </span>
        }
        description="Only confirmed payments count. Overpayment refunds reduce the original contributor’s net paid amount; waived excess and volunteer coverage are recorded separately. Private ledger recording stays separate."
      >
        {!readOnly && (
          <dl className="mb-4 flex flex-wrap gap-x-6 gap-y-4 rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border bg-white text-slate-700">
                <WalletCards size={19} aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs text-slate-600">
                  {bill.receiver_id
                    ? "Net contributions paid"
                    : "Paid to bill provider"}
                </dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {money(bill.merchant_paid)}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border bg-white text-slate-700">
                <Clock size={19} aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs text-slate-600">Bill still unpaid</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {money(bill.remaining_bill)}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full border bg-white text-slate-700">
                <ArrowDownLeft size={19} aria-hidden="true" />
              </span>
              <div>
                <dt className="text-xs text-slate-600">Reimbursement owed</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {money(bill.reimbursement_due || 0)}
                </dd>
              </div>
            </div>
          </dl>
        )}
        {bill.payments.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paid by</TableHead>
                  <TableHead>Paid to</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700"
                        >
                          {initials(payment.payer_name)}
                        </span>
                        <span>{payment.payer_name}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.paid_to_name || "Bill provider"}
                      {payment.kind === "refund" && (
                        <span className="mt-1 block text-xs text-slate-600">
                          Overpayment refund
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {money(payment.amount)}
                    </TableCell>
                    <TableCell>{dateLabel(payment.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          "text-xs " +
                          (payment.status === "pending"
                            ? "border-amber-200 bg-amber-50 text-amber-800"
                            : payment.status === "rejected"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-teal-200 bg-teal-50 text-teal-800")
                        }
                      >
                        {payment.status === "pending" ? (
                          <Clock aria-hidden="true" />
                        ) : payment.status === "rejected" ? (
                          <XCircle aria-hidden="true" />
                        ) : (
                          <CheckCircle2 aria-hidden="true" />
                        )}
                        {payment.status === "pending"
                          ? "Awaiting confirmation"
                          : payment.status === "rejected"
                            ? "Rejected · not counted"
                            : "Confirmed"}
                      </Badge>
                      {!readOnly &&
                        payment.status === "confirmed" &&
                        payment.ledger_reviewed === false && (
                          <span className="mt-1 block text-xs text-amber-800">
                            Ledger review needed
                          </span>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 text-sm text-slate-600">
            <Clock aria-hidden="true" className="text-slate-400" />
            No payments recorded. Contributions above are still unpaid.
          </div>
        )}
        {bill.closures?.length > 0 && (
          <ul className="mt-4 space-y-2 border-t pt-4 text-xs text-slate-600">
            {bill.closures.map((closure, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 text-teal-700"
                />
                <span>
                  Marked all paid on {dateLabel(closure.date.slice(0, 10))}:{" "}
                  {money(closure.covered)} covered by volunteers;{" "}
                  {money(closure.waived)} excess waived. No money movement
                  recorded.
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
