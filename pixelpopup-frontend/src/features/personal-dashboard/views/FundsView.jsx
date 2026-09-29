import { PiggyBank, Plus, ArrowDownLeft, HeartPulse } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import RecordList from "../components/RecordList";
import { coverageTypes } from "../lib/presets";

export default function FundsView(props) {
  const hasFund = props.dashboard.data.accounts.some(
    (a) => a.active && a.kind === "fund" && !coverageTypes.includes(a.fund_type),
  );
  return (
    <Tabs defaultValue="benefits" className="gap-5">
      <TabsList aria-label="Benefits and coverage" className="w-full flex-wrap justify-start gap-1 p-1 group-data-[orientation=horizontal]/tabs:h-auto sm:w-fit">
        <TabsTrigger value="benefits" className="px-3 py-2"><PiggyBank aria-hidden="true" /> Benefits</TabsTrigger>
        <TabsTrigger value="coverage" className="px-3 py-2"><HeartPulse aria-hidden="true" /> Coverage</TabsTrigger>
      </TabsList>
      <TabsContent value="benefits" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Contribute whenever you choose. Recorded fund values count toward
            net worth, not available cash. Do not record the same holding again
            in Assets.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!hasFund} onClick={() => props.openForm("fund_contribution")}>
              <Plus aria-hidden="true" /> Add contribution
            </Button>
            <Button variant="outline" disabled={!hasFund} onClick={() => props.openForm("fund_withdrawal")}>
              <ArrowDownLeft aria-hidden="true" /> Withdraw
            </Button>
          </div>
        </div>
        {!hasFund && <p className="text-sm text-slate-600">Add a fund below before recording contributions or withdrawals.</p>}
        <RecordList {...props} resource="accounts" kind="fund" addEntity="fund" fixedParams={{ coverage: "0" }} title="Funds & investments" />
      </TabsContent>
      <TabsContent value="coverage" className="space-y-5">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Insurance, HMO, and PhilHealth are coverage records, not cash holdings.
          They are excluded from net worth; record premiums under Expenses.
        </p>
        <RecordList
          {...props}
          resource="accounts"
          kind="fund"
          hideAdd
          headerActions={<Button onClick={() => props.openForm("fund", { fund_type: "insurance" })}><Plus aria-hidden="true" /> Add coverage</Button>}
          fixedParams={{ coverage: "1" }}
          title="Insurance & health coverage"
        />
      </TabsContent>
    </Tabs>
  );
}
