import { useLayoutEffect, useRef } from "react";
import { ChoiceField, Field } from "./shared";

const commonTimeZones = [
  "UTC", "Asia/Manila", "Asia/Singapore", "Asia/Tokyo", "Asia/Dubai",
  "Europe/London", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Los_Angeles", "Australia/Sydney",
];
const supportedTimeZones = typeof Intl.supportedValuesOf === "function"
  ? Intl.supportedValuesOf("timeZone")
  : commonTimeZones;
const timeZoneOptions = [...new Set([...commonTimeZones, ...supportedTimeZones])]
  .map((zone) => [zone, zone]);

export function phoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = phoneDigits(value);
  if (digits.length < 7) return digits;
  if (digits.length === 11 && digits.startsWith("09")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  let prefix = digits.slice(0, -4);
  const groups = [];
  while (prefix.length > 3) {
    groups.unshift(prefix.slice(-3));
    prefix = prefix.slice(0, -3);
  }
  if (prefix) groups.unshift(prefix);
  return [...groups, digits.slice(-4)].join(" ");
}

export function ClientPhoneField({ value, onChange, error }) {
  const inputRef = useRef(null);
  const caretDigits = useRef(null);
  const formatted = formatPhone(value);
  useLayoutEffect(() => {
    if (caretDigits.current == null || !inputRef.current) return;
    const targetDigits = caretDigits.current;
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < targetDigits) {
      if (/\d/.test(formatted[position])) seen += 1;
      position += 1;
    }
    inputRef.current.setSelectionRange(position, position);
    caretDigits.current = null;
  });
  const handleChange = (_, next, event) => {
    caretDigits.current = phoneDigits(next.slice(0, event.target.selectionStart ?? next.length)).length;
    onChange("phone", phoneDigits(next));
  };
  return <Field label="Phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="Digits only" value={formatted} onChange={handleChange} error={error} ref={inputRef}/>;
}

export function ClientTimeZoneField({ value, onChange, error }) {
  const options = value && !timeZoneOptions.some(([zone]) => zone === value)
    ? [["not-set", "Not specified"], [value, value], ...timeZoneOptions]
    : [["not-set", "Not specified"], ...timeZoneOptions];
  return <ChoiceField label="Time zone" name="timezone_name" value={value || "not-set"} onChange={(_, next) => onChange("timezone_name", next === "not-set" ? "" : next)} options={options} error={error}/>;
}
