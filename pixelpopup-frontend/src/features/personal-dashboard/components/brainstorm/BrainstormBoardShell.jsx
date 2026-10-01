import { useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
import { BoardPattern } from "./BrainstormPatterns";

export default function BrainstormBoardShell({ boardName, actions, children }) {
  const [expanded, setExpanded] = useState(false);
  const expandButton = useRef(null);

  const board = <section
    aria-label={`${boardName} idea board`}
    className={`relative isolate min-h-64 bg-white p-4 sm:p-6 ${expanded ? "" : "border border-[var(--pd-border)]"}`}
  >
    <BoardPattern />
    <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--pd-border)] pb-3">
      {expanded ? <><DialogTitle className="text-base font-semibold text-[var(--pd-ink)]">{boardName}</DialogTitle><DialogDescription className="sr-only">Expanded idea board. Press Escape or Close view to return to the page.</DialogDescription></> : <h2 className="text-base font-semibold text-[var(--pd-ink)]">{boardName}</h2>}
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <Button ref={expandButton} type="button" size="sm" variant="outline" onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Close expanded board" : "Expand board"}>
          {expanded ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
          {expanded ? "Close view" : "Expand board"}
        </Button>
      </div>
    </div>
    <div className="relative z-10">{children}</div>
  </section>;

  return <>
    {!expanded && board}
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent
        showCloseButton={false}
        className="personal-dashboard max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] overflow-y-auto p-0 sm:w-[94vw] sm:max-w-[94vw]"
        onCloseAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(() => expandButton.current?.focus()); }}
      >
        {expanded && board}
      </DialogContent>
    </Dialog>
  </>;
}
