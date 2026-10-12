import { DropdownMenu } from "radix-ui";
import { BookOpen, ChevronDown, FilePenLine, Sparkles } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";

export default function SkillGapActions({ disabled, onConfirm, onExample, onStudy }) {
  const items = [{ label: "Record actual contribution", icon: FilePenLine, action: onConfirm }, { label: "Generate hypothetical example", icon: Sparkles, action: onExample }, { label: "Prepare interview study plan", icon: BookOpen, action: onStudy }];
  return <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button type="button" size="sm" variant="outline" disabled={disabled}><BookOpen size={15}/>Close this skill gap<ChevronDown size={14}/></Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="personal-dashboard z-[70] min-w-64 rounded-md border bg-white p-1 text-slate-900 shadow-md">{items.map(({ label, icon: Icon, action }) => <DropdownMenu.Item key={label} onSelect={action} className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-800"><Icon size={16}/>{label}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
}
