import ChoiceTiles, { InstitutionLogo } from "./ChoiceTiles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { choiceIcon } from "../lib/presets";

export default function SelectableField({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  required,
  forceTiles = false,
}) {
  if (forceTiles || options.length < 3)
    return (
      <ChoiceTiles
        {...{
          id,
          label,
          options,
          value,
          onChange,
          disabled,
          invalid,
          describedBy,
          required,
          accountChoices: forceTiles,
        }}
      />
    );
  const hasNone = options.some((option) => option.value === "");
  return (
    <Select
      value={value === "" && hasNone ? "__none" : value || ""}
      onValueChange={(next) => onChange(next === "__none" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className="w-full"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
      >
        <SelectValue placeholder={"Select " + label.toLowerCase()} />
      </SelectTrigger>
      <SelectContent className="personal-dashboard" position="popper">
        {options.map((option) => {
          const Icon = option.icon || choiceIcon(option.value, option.label);
          return (
            <SelectItem
              key={option.value}
              value={option.value === "" ? "__none" : String(option.value)}
            >
              {option.logo ? (
                <InstitutionLogo
                  institution={option}
                  className="h-5 w-7 shrink-0"
                />
              ) : (
                <Icon
                  className="size-4 shrink-0 text-[var(--pd-primary)]"
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 truncate">{option.label}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
