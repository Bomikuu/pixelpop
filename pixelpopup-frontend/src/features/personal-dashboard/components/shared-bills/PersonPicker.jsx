import { useEffect, useState } from "react";
import { Search, X, UserPlus } from "lucide-react";
import { useRecords } from "../../hooks/useDashboardData";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import ChoiceTiles from "../ChoiceTiles";
import { ErrorState } from "../Panel";

export default function PersonPicker({
  request,
  version,
  selected,
  add,
  disabled,
  retry,
  value = "",
  id = "shared-person",
  label = "Add participants",
  allowCreate = true,
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
  const choiceValue = (person) => person.id ? String(person.id) : "legacy:" + person.name;
  const available = names
    .filter(
      (person) =>
        (allowCreate || person.id) && !selected.some(
          (item) =>
            person.id ? String(item.contact_id || "") === String(person.id)
              : !item.contact_id && !item.new_person && item.name?.trim().toLowerCase() === person.name.trim().toLowerCase(),
        ),
    );
  const options = available.map((person) => ({ value: choiceValue(person), label: person.name,
    avatar_url: person.avatar_url, description: [person.nickname, person.organization, person.relationship,
      person.id ? "Person #" + person.id : "Not linked yet"].filter(Boolean).join(" · ") }));
  const exists = names.some(
    (person) =>
      person.name.trim().toLowerCase() === search.trim().toLowerCase(),
  );
  function choose(value) {
    const person = available.find((item) => choiceValue(item) === value);
    if (!person) return;
    add({ name: person.name, contact_id: person.id || null, avatar_url: person.avatar_url,
      contact_label: [person.nickname, person.organization, person.relationship].filter(Boolean).join(" · "), new_person: false });
    setSearch("");
    setQuery("");
    document.getElementById(id + "-search")?.focus();
  }
  return (
    <div className="space-y-3 border-t pt-4">
      <label htmlFor={id + "-search"} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-3 left-3 text-slate-500"
          aria-hidden="true"
        />
        <Input
          id={id + "-search"}
          type="search"
          maxLength={120}
          className="pr-10 pl-9"
          placeholder={allowCreate ? "Search saved people or enter a new name" : "Search by name, nickname or company"}
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
              document.getElementById(id + "-search")?.focus();
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
            <ChoiceTiles
              id={id + "-known"}
              label="Choose a saved person"
              options={options}
              value={value}
              onChange={choose}
              disabled={disabled}
              personChoices
            />
          )}
          {allowCreate && search.trim() && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                add({ name: search.trim(), contact_id: null, new_person: true });
                setSearch(""); setQuery("");
              }}
            >
              <UserPlus aria-hidden="true" />
              {exists ? "Add a different person named " : "Add new person: "}{search.trim()}
            </Button>
          )}
          {!options.length && (
            <p className="text-xs text-slate-600">
              {allowCreate ? "No matching people available to select. Add a new person or try another search."
                : "No matching saved people. Add them in People first, then link them here."}
            </p>
          )}
        </>
      )}
    </div>
  );
}
