import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { words } from "../lib/format";

export default function GlobalSearch({ request, select }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!query || composing) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        request("search/?q=" + encodeURIComponent(query), {
          signal: controller.signal,
        })
          .then((data) => {
            if (!controller.signal.aborted) {
              setRows(data);
              setError("");
            }
          })
          .catch((e) => {
            if (!controller.signal.aborted) setError(e.message);
          }),
      300,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, composing, request]);
  return (
    <div className="relative w-full sm:w-72">
      <label htmlFor="global-finance-search" className="sr-only">
        Search your financial records
      </label>
      <Search
        className="absolute left-3 top-3 text-slate-500"
        size={16}
        aria-hidden="true"
      />
      <Input
        id="global-finance-search"
        type="search"
        value={query}
        placeholder="Search your workspace"
        className="pl-9 pr-9"
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setRows([]);
          setError("");
        }}
      />
      {query && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            aria-label="Clear workspace search"
            onClick={() => {
              setQuery("");
              setRows([]);
              document.getElementById("global-finance-search")?.focus();
            }}
          >
            <X />
          </Button>
          <div
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-white p-2 shadow-lg"
            aria-label="Workspace search results"
          >
            {error ? (
              <p role="alert" className="p-2 text-sm text-red-800">
                {error}
              </p>
            ) : rows.length ? (
              rows.map((row) => (
                <button
                  key={row.tab + row.id}
                  className="flex w-full items-center justify-between gap-2 rounded-md bg-transparent p-3 text-left text-sm hover:bg-slate-100"
                  onClick={() => {
                    select(row);
                    setQuery("");
                    setRows([]);
                  }}
                >
                  <span className="min-w-0 break-words">{row.label}</span>
                  <span className="shrink-0 text-xs text-slate-600">
                    {words(row.tab)}
                  </span>
                </button>
              ))
            ) : (
              <p className="p-2 text-sm text-slate-600">
                Searching or no matching records.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
