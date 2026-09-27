import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CheckCircle2, Clock, ArrowDownLeft } from "lucide-react";
import { Panel } from "../Panel";
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

export default function BillBreakdown({ bill, readOnly = false }) {
  const rows = bill.participants.map((person) => ({
    ...person,
    value: Number(person.share),
  }));
  return (
    <div className="space-y-5">
      <Panel
        title="Contribution breakdown"
        description="Agreed contributions—not payment status. Fixed amounts are reserved first; the rest is split equally."
      >
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
          <div
            className="relative mx-auto h-64 w-full max-w-xs"
            aria-hidden="true"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="65%"
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
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
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
                  const advanced = Number(person.to_receive);
                  const paid = Number(person.paid);
                  const StatusIcon =
                    advanced > 0
                      ? ArrowDownLeft
                      : remaining <= 0
                        ? CheckCircle2
                        : Clock;
                  const status =
                    advanced > 0
                      ? "To receive " + money(advanced)
                      : remaining <= 0
                        ? "Paid"
                        : paid > 0
                          ? "Partially paid · " + money(remaining) + " left"
                          : "Unpaid · " + money(remaining);
                  return (
                    <TableRow key={person.id}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-50 text-xs font-semibold"
                            style={{ color: colors[index % colors.length] }}
                          >
                            {initials(person.name)}
                          </span>
                          <span className="break-words">
                            {person.name}
                            <span className="block text-xs text-slate-500">
                              {person.share_is_fixed
                                ? "Fixed contribution"
                                : "Split remainder"}
                            </span>
                            {person.is_me && !readOnly && (
                              <span className="ml-1 text-xs text-slate-500">
                                (You)
                              </span>
                            )}
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
                        <span
                          className={
                            "flex items-center gap-1.5 text-xs " +
                            (remaining <= 0
                              ? "text-teal-800"
                              : "text-slate-600")
                          }
                        >
                          <StatusIcon size={15} aria-hidden="true" />
                          {status}
                        </span>
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
        title="Payments"
        description="Payments to the provider and reimbursements to people are separate. Only confirmed payments count toward the balances above; public reports await owner confirmation."
      >
        <p className="mb-4 text-sm text-slate-600">
          Paid to bill provider:{" "}
          <strong className="text-slate-950 tabular-nums">
            {money(bill.merchant_paid)}
          </strong>{" "}
          · Bill still unpaid:{" "}
          <strong className="tabular-nums">{money(bill.remaining_bill)}</strong>
        </p>
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
                    <TableCell>{payment.payer_name}</TableCell>
                    <TableCell>
                      {payment.paid_to_name || "Bill provider"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {money(payment.amount)}
                    </TableCell>
                    <TableCell>{dateLabel(payment.date)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          "text-xs " +
                          (payment.status === "pending"
                            ? "text-amber-800"
                            : payment.status === "rejected"
                              ? "text-red-700"
                              : "text-teal-800")
                        }
                      >
                        {payment.status === "pending"
                          ? "Awaiting confirmation"
                          : payment.status === "rejected"
                            ? "Rejected · not counted"
                            : "Confirmed"}
                      </span>
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
      </Panel>
    </div>
  );
}
