import SummaryTiles from "./SummaryTiles";
import { money, monthLabel } from "../lib/format";

export default function PeopleSummary({ summary, month }) {
  return (
    <SummaryTiles
      items={[
        {
          label: "Given in " + monthLabel(month),
          value: money(summary.given),
          icon: "expenses",
        },
        { label: "Lent · lifetime", value: money(summary.lent), icon: "loans" },
        {
          label: "Repaid · lifetime",
          value: money(summary.repaid),
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
