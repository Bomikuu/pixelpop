import { PiggyBank, Plus, ArrowDownLeft } from "lucide-react";
import { Button } from "../ui/button";
import RecordList from "../components/RecordList";

export default function FundsView(props) {
  const hasFund = props.dashboard.data.accounts.some(
    (a) => a.active && a.kind === "fund",
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          <PiggyBank
            size={18}
            className="mr-2 inline text-[var(--pd-primary)]"
            aria-hidden="true"
          />
          Contribute whenever you choose. These recorded values are included in
          net worth, not available cash. Do not record the same holding again in
          Assets.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!hasFund}
            onClick={() => props.openForm("fund_contribution")}
          >
            <Plus />
            Add contribution
          </Button>
          <Button
            variant="outline"
            disabled={!hasFund}
            onClick={() => props.openForm("fund_withdrawal")}
          >
            <ArrowDownLeft />
            Withdraw
          </Button>
        </div>
      </div>
      {!hasFund && (
        <p className="text-sm text-slate-600">
          Add a fund below before recording contributions or withdrawals.
        </p>
      )}
      <RecordList
        {...props}
        resource="accounts"
        kind="fund"
        addEntity="fund"
        title="Benefits & investments"
      />
    </div>
  );
}
