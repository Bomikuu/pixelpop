import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { words } from "../lib/format";

export default function GlobalSearch({ request, select }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [retry, setRetry] = useState(0);
  const root = useRef(null);
  const input = useRef(null);
  const inputId = useId();
  const resultsId = `${inputId}-results`;
  const expanded = open && Boolean(query.trim());

  function choose(row) {
    select(row);
    setQuery("");
    setRows([]);
    setActive(-1);
    setOpen(false);
  }

  useEffect(() => {
    if (!query.trim() || composing) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        request("search/?q=" + encodeURIComponent(query.trim()), {
          signal: controller.signal,
        })
          .then((data) => {
            if (!controller.signal.aborted) {
              setRows(data);
              setError("");
              setLoading(false);
            }
          })
          .catch((e) => {
            if (!controller.signal.aborted) {
              setError(e.message);
              setLoading(false);
            }
          }),
      300,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, composing, request, retry]);
  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [expanded]);
  useEffect(() => {
    if (expanded && active >= 0) document.getElementById(`${resultsId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [expanded, active, resultsId]);

  return (
    <div ref={root} className="relative w-full sm:w-72" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label htmlFor={inputId} className="sr-only">
        Search your workspace
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        size={16}
        aria-hidden="true"
      />
      <Input
        ref={input}
        id={inputId}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? resultsId : undefined}
        aria-activedescendant={expanded && active >= 0 && rows[active] ? `${resultsId}-${active}` : undefined}
        aria-describedby={`${inputId}-help`}
        value={query}
        placeholder="Search your workspace"
        className="h-11 pl-9 pr-12 md:h-9 md:pr-9"
        onFocus={() => setOpen(true)}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setRows([]);
          setError("");
          setLoading(Boolean(e.target.value.trim()));
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (composing || event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            setActive(-1);
          } else if (["ArrowDown", "ArrowUp"].includes(event.key) && query.trim()) {
            event.preventDefault();
            setOpen(true);
            if (rows.length) setActive((index) => event.key === "ArrowDown" ? (index + 1) % rows.length : index <= 0 ? rows.length - 1 : index - 1);
          } else if (event.key === "Enter" && expanded && rows[active]) {
            event.preventDefault();
            choose(rows[active]);
          }
        }}
      />
      <span id={`${inputId}-help`} className="sr-only">Use the arrow keys to choose a result, Enter to open it, and Escape to close results.</span>
      {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            aria-label="Clear workspace search"
            onClick={() => {
              setQuery("");
              setRows([]);
              setError("");
              setLoading(false);
              setActive(-1);
              setOpen(false);
              input.current?.focus();
            }}
          >
            <X />
          </Button>
      )}
      {expanded && (
          <div
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-white p-2 shadow-lg"
          >
            {error ? (
              <div className="space-y-2 p-2"><p role="alert" className="text-sm text-red-800">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => { setError(""); setLoading(true); setRetry((value) => value + 1); }}>Retry search</Button></div>
            ) : <p role="status" className="flex items-center gap-2 p-2 text-sm text-slate-600">{composing ? "Finish typing to search." : loading ? <><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />Searching…</> : rows.length ? `${rows.length} ${rows.length === 1 ? "result" : "results"} found.` : "No matching records. Try another name."}</p>}
            <ul id={resultsId} role="listbox" aria-label="Workspace search results" aria-busy={loading}>
              {rows.map((row, index) => (
                <li key={row.tab + row.id} role="presentation">
                <button
                  id={`${resultsId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={active === index}
                  tabIndex={-1}
                  className={"flex min-h-11 w-full items-center justify-between gap-2 rounded-md p-3 text-left text-sm hover:bg-slate-100 " + (active === index ? "bg-blue-50 text-slate-950" : "bg-transparent")}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(row)}
                >
                  <span className="min-w-0 break-words">{row.label}</span>
                  <span className="shrink-0 text-xs text-slate-600">
                    {words(row.tab)}
                  </span>
                </button>
                </li>
              ))}
            </ul>
          </div>
      )}
    </div>
  );
}
