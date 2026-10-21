import { useEffect, useState } from "react";
import { BookmarkPlus, Check, ChevronLeft, ChevronRight, Copy, Pencil, Search, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ErrorState } from "../Panel";
import { dateLabel } from "../../lib/format";
import { nutritionNumber as number } from "../../nutrition/dashboardModel";
const endpoints = { history: "meals/history", foods: "foods", presets: "presets" };
export default function MealLibraryDialog({ date, request, onChooseMeal, onChooseFoods, onEditPreset, onDeletePreset, onCreatePreset, onClose, restoreFocus, refreshKey = 0 }) {
  const [tab, setTab] = useState("history"), [query, setQuery] = useState(""), [search, setSearch] = useState(""), [composing, setComposing] = useState(false), [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState({}), [state, setState] = useState({ key: "", data: null, error: "" });
  useEffect(() => { if (composing) return; const timer = window.setTimeout(() => { setSearch(query); setPage(1); }, query ? 300 : 0); return () => window.clearTimeout(timer); }, [query, composing]);
  const key = `${tab}:${search}:${page}:${retry}:${refreshKey}`;
  useEffect(() => {
    const controller = new AbortController();
    request(`nutrition/${endpoints[tab]}/?q=${encodeURIComponent(search)}&page=${page}&page_size=20`, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) {
        const lastPage = Math.max(1, Math.ceil(data.count / 20));
        if (page > lastPage) setPage(lastPage);
        else setState({ key, data, error: "" });
      }
    }).catch((failure) => { if (!controller.signal.aborted) setState({ key, data: null, error: failure.message }); });
    return () => controller.abort();
  }, [tab, search, page, retry, refreshKey, key, request]);
  const loading = state.key !== key || query !== search || composing;
  const selectedFoods = Object.values(selected);
  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}><DialogContent className="personal-dashboard flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-2xl" onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>Meal library</DialogTitle><DialogDescription>Reuse a recorded portion for {dateLabel(date)}. Selection opens a draft for review; it doesn’t log anything.</DialogDescription></DialogHeader>
    <Tabs value={tab} onValueChange={(value) => { setTab(value); setPage(1); setSelected({}); }} className="min-h-0 flex-1 gap-4"><TabsList aria-label="Meal library source" className="max-w-full"><TabsTrigger value="history">Past meals</TabsTrigger><TabsTrigger value="foods">Foods</TabsTrigger><TabsTrigger value="presets">Saved meals</TabsTrigger></TabsList>
    <TabsContent value={tab} className="flex min-h-0 flex-1 flex-col gap-4">
    <div className="relative"><Label htmlFor="meal-library-search" className="sr-only">Search {tab === "foods" ? "foods" : "meals"}</Label><Search className="absolute left-3 top-2.5 size-4 text-slate-400" aria-hidden="true" /><Input id="meal-library-search" className="pl-9 pr-9" value={query} maxLength={160} placeholder="Search by name…" onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" className="absolute right-2 top-1 grid size-7 place-items-center text-slate-500" onClick={() => { setQuery(""); setSearch(""); setPage(1); }}><X className="size-4" /></button>}</div>
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto" aria-busy={loading}>{loading ? <p role="status" className="py-6 text-sm text-slate-500">Loading library…</p> : state.error ? <ErrorState message={state.error} retry={() => setRetry((value) => value + 1)} /> : state.data?.results.length ? <ul className="divide-y divide-[var(--pd-border)]">{state.data.results.map((item) => <li key={item.id} className="flex flex-wrap items-start gap-3 py-3">
      {tab === "foods" && <input type="checkbox" className="mt-1 size-4 accent-blue-600" aria-label={`Select ${item.name}, ${item.amount} ${item.unit} from ${item.source_date}`} checked={!!selected[item.id]} onChange={(event) => setSelected((current) => { const next = { ...current }; event.target.checked ? next[item.id] = item : delete next[item.id]; return next; })} />}
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{tab === "foods" ? item.name : item.meal_name}</p><p className="mt-1 text-xs text-slate-600">{tab === "foods" ? `${number(item.amount, 3)} ${item.unit} · ${number(item.calories, 2)} kcal` : `${item.items.length} foods · ${number(item.totals.calories, 2)} kcal`}</p><p className="mt-1 text-xs text-slate-500">{tab === "history" ? dateLabel(item.date) : tab === "foods" ? `${dateLabel(item.source_date)} · ${item.source_meal_name}` : "Saved to your account"}</p></div>
      {tab !== "foods" && <Button size="sm" variant="outline" onClick={() => onChooseMeal(item)}><Copy className="size-3.5" />Use</Button>}{tab === "presets" && <><Button size="icon" variant="ghost" aria-label={`Edit ${item.meal_name}`} onClick={() => onEditPreset(item)}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" className="text-red-700" aria-label={`Delete ${item.meal_name}`} onClick={() => onDeletePreset(item)}><Trash2 className="size-4" /></Button></>}
    </li>)}</ul> : <p className="py-6 text-sm text-slate-500">{search ? "No matches. Try another name." : tab === "presets" ? "No saved meals yet. Save a logged meal as a preset, or create one here." : "No recorded meals to reuse yet."}</p>}</div>
    <DialogFooter className="flex-wrap sm:justify-between"><div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Previous library page" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" /></Button><span className="text-xs text-slate-600">Page {page}{!loading && state.data && ` · ${state.data.count} results`}</span><Button size="icon" variant="outline" aria-label="Next library page" disabled={loading || !state.data || page * 20 >= state.data.count} onClick={() => setPage((value) => value + 1)}><ChevronRight className="size-4" /></Button></div><div className="flex flex-wrap gap-2">{tab === "presets" && <Button variant="outline" onClick={onCreatePreset}><BookmarkPlus className="size-4" />New preset</Button>}{tab === "foods" && <Button disabled={!selectedFoods.length || selectedFoods.length > 100} onClick={() => onChooseFoods(selectedFoods)}><Check className="size-4" />Use {selectedFoods.length} foods</Button>}<Button variant="outline" onClick={onClose}>Close</Button></div></DialogFooter>
    </TabsContent></Tabs>
  </DialogContent></Dialog>;
}
