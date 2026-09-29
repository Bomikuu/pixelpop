import {
  CreditCard,
  Pencil,
  History,
  ArrowLeftRight,
  Trash2,
  Plus,
  ArrowDownLeft,
  Receipt,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { money } from "../lib/format";
import { coverageTypes, institutionFor } from "../lib/presets";
import AccountCardFace from "./AccountCardFace";
import { InstitutionLogo } from "./ChoiceTiles";

export default function AccountCards({
  rows,
  month,
  openForm,
  showHistory,
  confirmDelete,
}) {
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((account) => {
        const card = account.kind === "credit_card",
          fund = account.kind === "fund",
          coverage = fund && coverageTypes.includes(account.fund_type),
          showInstitution = !fund && account.kind !== "cash",
          institution = showInstitution ? institutionFor(account.institution || account.name) : null,
          debt = Number(account.balance),
          limit = Number(account.credit_limit),
          utilization = limit > 0 ? Math.max(0, (debt / limit) * 100) : null;
        return (
          <article
            key={account.id}
            className={
              "overflow-hidden rounded-xl border border-[var(--pd-border)] bg-white transition-colors hover:border-blue-300 motion-reduce:transition-none " +
              (account.active ? "" : "opacity-60")
            }
          >
            <div className="p-4 sm:p-5">
              <Link
                to={"/dashboard/accounts/" + account.id + "?month=" + month}
                aria-label={"View " + account.name + " account details"}
                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]"
              >
                <AccountCardFace account={account} align="left" />
                <div className="mt-4 flex min-w-0 items-center gap-3">
                  {showInstitution && (
                    <span className="grid h-10 w-16 shrink-0 place-items-center rounded-md border border-[var(--pd-border)] bg-white p-1" aria-hidden="true">
                      <InstitutionLogo institution={institution} className="h-7 w-full" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-[var(--pd-ink)] group-hover:text-[var(--pd-primary)] group-hover:underline">
                      {account.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {account.institution || "Manually tracked"}
                      {!account.active ? " · archived" : ""}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="mt-4">
                <p className="text-xs text-slate-600">
                  {coverage
                    ? "Coverage record"
                    : fund
                    ? "Current recorded value"
                    : card
                      ? "Outstanding debt"
                      : "Available balance"}
                </p>
                <p className={"mt-1 break-words font-semibold text-[var(--pd-ink)] " + (coverage ? "text-sm" : "text-2xl tabular-nums")}>
                  {coverage ? "Not included in net worth" : money(account.balance)}
                </p>
              </div>
            </div>
            <div className="space-y-4 border-t border-[var(--pd-border)] bg-white p-4">
              {card && (
                <div>
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                    <span>
                      Limit{" "}
                      {account.credit_limit == null
                        ? "not set"
                        : money(account.credit_limit)}
                    </span>
                    <span>
                      {utilization == null
                        ? "Set a limit to track usage"
                        : utilization.toFixed(1) + "% used"}
                    </span>
                  </div>
                  {utilization != null && (
                    <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
                      <div
                        className={
                          "h-full " +
                          (utilization >= 90
                            ? "bg-amber-600"
                            : "bg-[var(--pd-primary)]")
                        }
                        style={{ width: Math.min(utilization, 100) + "%" }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={"Edit " + account.name}
                  onClick={() => openForm(fund ? "fund" : "account", account)}
                >
                  <Pencil />
                </Button>
                {coverage ? (
                  <Button asChild variant="ghost" size="icon-sm" aria-label={"Premium payment history for " + account.name}>
                    <Link to={"/dashboard/accounts/" + account.id + "?month=" + month}><History /></Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={"History for " + account.name}
                    onClick={() => showHistory("accounts", account)}
                  >
                    <History />
                  </Button>
                )}
                {account.active && (
                  <>
                    {!coverage && <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={"Correct " + account.name + " balance"}
                      onClick={() => openForm("adjustment", account)}
                    >
                      <ArrowLeftRight />
                    </Button>}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={"Archive " + account.name}
                      onClick={() => confirmDelete("accounts", account)}
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
                {card && account.active && debt > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() =>
                      openForm("movement", {
                        kind: "credit_card_payment",
                        destination: account.id,
                      })
                    }
                  >
                    <CreditCard />
                    Record payment
                  </Button>
                )}
              </div>
              {fund && !coverage && account.active && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      openForm("fund_contribution", { destination: account.id })
                    }
                  >
                    <Plus />
                    Contribute
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openForm("fund_withdrawal", { source: account.id })
                    }
                  >
                    <ArrowDownLeft />
                    Withdraw
                  </Button>
                </div>
              )}
              {coverage && account.active && (
                <Button
                  size="sm"
                  onClick={() => openForm("expense", { name: account.name + " premium", coverage: account.id })}
                >
                  <Receipt aria-hidden="true" /> Record premium payment
                </Button>
              )}
              <p className="text-xs text-slate-500">
                {fund
                  ? coverage ? "Coverage only · premiums belong in expenses" : "Manually tracked · not spendable cash or a live provider balance"
                  : "Manual ledger display · no full card number stored"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
