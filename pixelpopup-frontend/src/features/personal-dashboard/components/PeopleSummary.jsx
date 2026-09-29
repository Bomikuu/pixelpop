import SummaryTiles from "./SummaryTiles";
import MoneyFlowAmount from "./MoneyFlowAmount";
import { money, monthLabel } from "../lib/format";

export default function PeopleSummary({ summary, month }) {
  return (
    <SummaryTiles
      items={[
        {
          label: "Given in " + monthLabel(month),
          value: <MoneyFlowAmount amount={summary.given} direction="out" />,
          icon: "expenses",
        },
        { label: "Lent · lifetime", value: <MoneyFlowAmount amount={summary.lent} direction="out" />, icon: "loans" },
        {
          label: "Repaid · lifetime",
          value: <MoneyFlowAmount amount={summary.repaid} direction="in" />,
          icon: "income",
        },
        {
          label: "Outstanding now",
          value: money(summary.outstanding),
          icon: "loans",
        },
      ]}
    />
  );
}
