import { Link } from "react-router-dom";
import { Progress } from "../ui/progress";
import { money } from "../lib/format";
import { coverageTypes, institutionFor } from "../lib/presets";
import AccountCardFace from "./AccountCardFace";
import { InstitutionLogo } from "./ChoiceTiles";
import AccountActionsMenu from "./AccountActionsMenu";

export default function AccountCards({
  rows,
  month,
  openForm,
  showHistory,
  confirmDelete,
  dashboard,
  notify,
}) {
  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {rows.map((account) => {
        const card = account.kind === "credit_card",
          fund = account.kind === "fund",
          coverage = fund && coverageTypes.includes(account.fund_type),
          showInstitution = !fund && account.kind !== "cash",
          institution = showInstitution ? institutionFor(account.institution || account.name) : null,
          debt = Number(account.balance),
          limit = Number(account.credit_limit),
          utilization = limit > 0 ? Math.max(0, ((account.available_credit != null ? limit - Number(account.available_credit) : debt) / limit) * 100) : null;
        return (
          <article
            key={account.id}
            className={
              "overflow-hidden rounded-xl border border-[var(--pd-border)] bg-white transition-colors hover:border-blue-300 motion-reduce:transition-none " +
              (account.active ? "" : "opacity-60")
            }
          >
            <div className="p-3">
              <Link
                to={"/dashboard/accounts/" + account.id + "?month=" + month}
                aria-label={"View " + account.name + " account details"}
                className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]"
              >
                <AccountCardFace account={account} align="left" size="small" />
                <div className="mt-3 flex min-w-0 items-center gap-2">
                  {showInstitution && (
                    <span className="grid h-8 w-12 shrink-0 place-items-center rounded-md border border-[var(--pd-border)] bg-white p-1" aria-hidden="true">
                      <InstitutionLogo institution={institution} className="h-6 w-full" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-[var(--pd-ink)] group-hover:text-[var(--pd-primary)] group-hover:underline">
                      {account.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {account.institution || "Manually tracked"}
                      {!account.active ? " · archived" : ""}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="mt-3">
                <p className="text-xs text-slate-600">
                  {coverage
                    ? "Coverage record"
                    : fund
                    ? "Current recorded value"
                    : card
                      ? "Outstanding debt"
                      : "Available balance"}
                </p>
                <p className={"mt-1 break-words font-semibold text-[var(--pd-ink)] " + (coverage ? "text-sm" : "text-xl tabular-nums")}>
                  {coverage ? "Not included in net worth" : money(account.balance)}
                </p>
              </div>
            </div>
            <div className="space-y-3 border-t border-[var(--pd-border)] bg-white p-3">
              {card && (
                <div>
                  {account.available_credit != null && <p className="mb-2 text-xs tabular-nums text-slate-600">{money(account.available_credit)} available credit{Number(account.additional_reservation) > 0 && " · " + money(account.additional_reservation) + " reserved for loan costs"}</p>}
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
                    <Progress value={Math.min(utilization, 100)} aria-label={account.name + " credit limit used"} aria-valuetext={utilization.toFixed(1) + "% used"} className={"mt-2 bg-slate-100 [&_[data-slot=progress-indicator]]:motion-reduce:transition-none " + (utilization >= 90 ? "[&_[data-slot=progress-indicator]]:bg-amber-600" : "")} />
                  )}
                </div>
              )}
              <AccountActionsMenu account={account} dashboard={dashboard} month={month} openForm={openForm} showHistory={showHistory} confirmDelete={confirmDelete} notify={notify} allowArchivedEdit />
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
