import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

export default function BrainstormFilterSelect({ id, value, onChange, items, placeholder = "All", className = "", labelText, disabled = false }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}>
    <SelectTrigger id={id} aria-label={labelText} className={`h-9 bg-white ${className}`}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="personal-dashboard" position="popper">
      {items.map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
    </SelectContent>
  </Select>;
}
