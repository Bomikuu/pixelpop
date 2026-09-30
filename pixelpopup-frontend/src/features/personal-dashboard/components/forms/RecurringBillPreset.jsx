import SelectableField from "../SelectableField";
import { utilityPresets } from "../../lib/presets";

export default function RecurringBillPreset({ value, onChange, disabled }) {
  return <div className="space-y-2 border-b pb-4">
    <p className="text-sm font-medium">Start with a recurring bill</p>
    <SelectableField id="utility-preset" label="Recurring bill preset" options={utilityPresets}
      value={value} onChange={onChange} disabled={disabled} />
  </div>;
}
