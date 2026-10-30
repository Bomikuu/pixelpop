import { BriefcaseBusiness, House } from "lucide-react";
import { ToggleGroup } from "radix-ui";

export default function WorkspaceSwitcher({ workspace, onSwitch }) {
  return <ToggleGroup.Root type="single" value={workspace} onValueChange={(value) => {
    if (value && value !== workspace) onSwitch(value);
  }} aria-label="Switch workspace" className="workspace-switcher grid min-w-0 grid-cols-2 gap-1 rounded-lg border border-[var(--pd-border)] bg-[var(--pd-soft)] p-1 lg:hidden">
    <ToggleGroup.Item value="personal" aria-label="Personal workspace" className="workspace-switcher-option"><House size={17} aria-hidden="true" />Personal</ToggleGroup.Item>
    <ToggleGroup.Item value="business" aria-label="Business workspace" className="workspace-switcher-option"><BriefcaseBusiness size={17} aria-hidden="true" />Business</ToggleGroup.Item>
  </ToggleGroup.Root>;
}
