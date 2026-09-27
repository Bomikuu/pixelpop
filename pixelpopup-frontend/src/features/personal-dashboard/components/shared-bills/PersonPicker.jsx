import { useEffect, useState } from "react";
import { Search, X, UserPlus, Users } from "lucide-react";
import { useRecords } from "../../hooks/useDashboardData";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";
import { ErrorState } from "../Panel";

export default function PersonPicker({
  request,
  version,
  selected,
  add,
  disabled,
  retry,
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, composing]);
  const state = useRecords(
    "people-options/?q=" + encodeURIComponent(query),
    request,
    version,
  );
  const names = state.data || [];
  const options = names
    .filter(
      (person) =>
        !selected.some(
          (item) =>
            item.name.trim().toLowerCase() === person.name.trim().toLowerCase(),
        ),
    )
    .map((person) => ({ value: person.name, label: person.name, icon: Users }));
  const exists = [...selected, ...names].some(
    (person) =>
      person.name.trim().toLowerCase() === search.trim().toLowerCase(),
  );
  function choose(name) {
    add(name);
    setSearch("");
    setQuery("");
  }
  return (
    <div className="space-y-3 border-t pt-4">
      <label htmlFor="shared-person-search" className="text-sm font-medium">
        Add participants
      </label>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-3 left-3 text-slate-500"
          aria-hidden="true"
        />
        <Input
          id="shared-person-search"
          type="search"
          maxLength={120}
          className="pr-10 pl-9"
          placeholder="Search saved people or enter a new name"
          value={search}
          disabled={disabled}
          onChange={(event) => setSearch(event.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-0.5 right-1"
            disabled={disabled}
            aria-label="Clear person search"
            onClick={() => {
              setSearch("");
              setQuery("");
              document.getElementById("shared-person-search")?.focus();
            }}
          >
            <X />
          </Button>
        )}
      </div>
      {state.loading || query !== search.trim() || composing ? (
        <p role="status" className="text-xs text-slate-600">
          Finding people…
        </p>
      ) : state.error ? (
        <ErrorState message={state.error} retry={retry} />
      ) : (
        <>
          {options.length > 0 && (
            <Select value="" onValueChange={choose} disabled={disabled}>
              <SelectTrigger
                id="shared-known-person"
                className="w-full"
                aria-label="Choose saved person"
              >
                <SelectValue placeholder="Choose a saved person" />
              </SelectTrigger>
              <SelectContent className="personal-dashboard" position="popper">
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <Users
                      className="size-4 text-[var(--pd-primary)]"
                      aria-hidden="true"
                    />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {search.trim() && !exists && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => choose(search.trim())}
            >
              <UserPlus aria-hidden="true" />
              Add new person: {search.trim()}
            </Button>
          )}
          {!options.length && (!search.trim() || exists) && (
            <p className="text-xs text-slate-600">
              {exists
                ? "This person is already selected."
                : "No saved people available. Enter a name to add someone new."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
