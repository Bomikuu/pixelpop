import {
  CreditCard,
  Cpu,
  Pencil,
  History,
  ArrowLeftRight,
  Trash2,
  Plus,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "../ui/button";
import { InstitutionLogo } from "./ChoiceTiles";
import { institutionFor, choiceIcon, fundTypes } from "../lib/presets";
import { money } from "../lib/format";

export default function AccountCards({
  rows,
  openForm,
  showHistory,
  confirmDelete,
}) {
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((account) => {
        const card = account.kind === "credit_card",
          fund = account.kind === "fund",
          debt = Number(account.balance),
          limit = Number(account.credit_limit),
          utilization = limit > 0 ? Math.max(0, (debt / limit) * 100) : null;
        const bank = institutionFor(account.institution || account.name);
        const Icon = choiceIcon(fund ? account.fund_type : account.kind);
        return (
          <article
            key={account.id}
            className={
              "overflow-hidden rounded-xl border transition-colors hover:border-blue-300 " +
              (account.active ? "" : "opacity-60")
            }
          >
            <div
              className={
                "flex min-h-52 flex-col justify-between p-5 " +
                (card
                  ? "bg-[var(--pd-ink)] text-white"
                  : "bg-white text-slate-950")
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs ">
                    {fund
                      ? fundTypes.find((p) => p.value === account.fund_type)
                          ?.label || "Fund"
                      : card
                        ? "Credit card"
                        : account.kind === "ewallet"
                          ? "Digital wallet"
                          : account.kind === "cash"
                            ? "Cash"
                            : "Bank account"}
                    {!account.active ? " · archived" : ""}
                  </p>
                  <h3 className="mt-1 break-words text-base font-semibold">
                    {account.name}
                  </h3>
                </div>
                {bank ? (
                  <span className="grid h-10 w-20 shrink-0 place-items-center rounded-md bg-white p-2">
                    <InstitutionLogo institution={bank} />
                  </span>
                ) : (
                  <Icon size={24} aria-hidden="true" />
                )}
              </div>
              {card && (
                <Cpu
                  size={28}
                  className="my-4 text-slate-300"
                  aria-hidden="true"
                />
              )}
              <div className="mt-5">
                <p
                  className={
                    "text-xs " + (card ? "text-slate-300" : "text-slate-600")
                  }
                >
                  {fund
                    ? "Current recorded value"
                    : card
                      ? "Outstanding debt"
                      : "Available balance"}
                </p>
                <p className="mt-1 break-words text-2xl font-semibold tabular-nums">
                  {money(account.balance)}
                </p>
                <p
                  className={
                    "mt-2 text-xs " +
                    (card ? "text-slate-300" : "text-slate-600")
                  }
                >
                  {account.institution || "Manually tracked"}
                </p>
              </div>
            </div>
            <div className="space-y-4 bg-white p-4">
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={"History for " + account.name}
                  onClick={() => showHistory("accounts", account)}
                >
                  <History />
                </Button>
                {account.active && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={"Correct " + account.name + " balance"}
                      onClick={() => openForm("adjustment", account)}
                    >
                      <ArrowLeftRight />
                    </Button>
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
              {fund && account.active && (
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
              <p className="text-xs text-slate-500">
                {fund
                  ? "Manually tracked · not spendable cash or a live provider balance"
                  : "Manual ledger display · no card number stored"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
