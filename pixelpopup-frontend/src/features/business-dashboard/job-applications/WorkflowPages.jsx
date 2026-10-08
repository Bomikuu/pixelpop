import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";

export default function WorkflowPages({ data, page, onPage, busy }) {
  if (!data) return null;
  return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
    <p className="text-xs text-slate-600">{data.count} records · Page {page}</p>
    <div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy || !data.previous} onClick={() => onPage(page - 1)}><ChevronLeft size={15}/>Previous</Button><Button size="sm" variant="outline" disabled={busy || !data.next} onClick={() => onPage(page + 1)}>Next<ChevronRight size={15}/></Button></div>
  </div>;
}
