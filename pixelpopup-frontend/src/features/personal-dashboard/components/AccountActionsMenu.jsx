import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import { ArrowDownLeft, ArrowLeftRight, ChevronDown, CreditCard, History, Landmark, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { coverageTypes } from "../lib/presets";
import CashLoanForm from "../cash-loans/CashLoanForm";

export default function AccountActionsMenu({ account, dashboard, month, openForm, showHistory, confirmDelete, notify, premiumDue, allowArchivedEdit = false }) {
  const trigger = useRef(null);
  const opening = useRef(false);
  const [addingLoan, setAddingLoan] = useState(false);
  const card = account.kind === "credit_card";
  const fund = account.kind === "fund";
  const coverage = fund && coverageTypes.includes(account.fund_type);
  const actions = [];
  if (account.active) {
    if (!coverage) actions.push(["Correct balance", ArrowLeftRight, () => openForm("adjustment", account)]);
    if (card && Number(account.balance) > 0) actions.push(["Record payment", CreditCard, () => openForm("movement", { kind: "credit_card_payment", destination: account.id })]);
    if (card) actions.push(["Make cash loan", Landmark, () => setAddingLoan(true)]);
    if (!fund) {
      if (!card) actions.push(["Add income", ArrowDownLeft, () => openForm("income", { account: account.id })]);
      actions.push(["Add expense", Plus, () => openForm("expense", { account: account.id })]);
    }
    if (fund && !coverage) {
      actions.push(["Contribute", Plus, () => openForm("fund_contribution", { destination: account.id })]);
      actions.push(["Withdraw", ArrowDownLeft, () => openForm("fund_withdrawal", { source: account.id })]);
    }
    if (coverage) actions.push(["Record premium payment", Receipt, () => premiumDue ? openForm("settlement", premiumDue) : openForm("expense", { name: account.name + " premium", coverage: account.id })]);
  }
  if (account.active || allowArchivedEdit) actions.push(["Edit account", Pencil, () => openForm(fund ? "fund" : "account", account)]);

  const select = (action) => {
    opening.current = true;
    trigger.current?.focus();
    action();
  };
  const itemClass = "flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-[var(--pd-soft)]";

  return <>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button ref={trigger} variant="outline" size="sm" aria-label={"Actions for " + account.name}>Actions <ChevronDown aria-hidden="true" /></Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-50 min-w-48 rounded-md border border-[var(--pd-border)] bg-white p-1 text-[var(--pd-ink)] shadow-md" onCloseAutoFocus={(event) => {
          if (opening.current) { event.preventDefault(); opening.current = false; }
        }}>
          {actions.map(([label, Icon, action]) => <DropdownMenu.Item key={label} className={itemClass} onSelect={() => select(action)}><Icon size={16} aria-hidden="true" />{label}</DropdownMenu.Item>)}
          {coverage ? <DropdownMenu.Item asChild className={itemClass}><Link to={`/dashboard/accounts/${account.id}?month=${month}`}><History size={16} aria-hidden="true" />Premium payment history</Link></DropdownMenu.Item> : <DropdownMenu.Item className={itemClass} onSelect={() => select(() => showHistory("accounts", account))}><History size={16} aria-hidden="true" />History</DropdownMenu.Item>}
          {account.active && <>
            <DropdownMenu.Separator className="my-1 h-px bg-[var(--pd-border)]" />
            <DropdownMenu.Item className={itemClass + " text-red-700 data-[highlighted]:bg-red-50"} onSelect={() => select(() => confirmDelete("accounts", account))}><Trash2 size={16} aria-hidden="true" />Archive account</DropdownMenu.Item>
          </>}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
    {addingLoan && <CashLoanForm card={account} accounts={dashboard.data.accounts} request={dashboard.request} onClose={() => { setAddingLoan(false); trigger.current?.focus(); }} onSaved={() => {
      setAddingLoan(false);
      dashboard.refresh();
      notify("Cash loan saved. Proceeds are tracked as financing, not income.", { action: "added", entity: "account" });
      trigger.current?.focus();
    }} />}
  </>;
}
