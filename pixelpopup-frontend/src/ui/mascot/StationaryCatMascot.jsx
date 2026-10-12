import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Toast } from "radix-ui";
import { CheckCircle2, MessageCircle, PartyPopper, TriangleAlert, X } from "lucide-react";
import { Button } from "../../features/personal-dashboard/ui/button";
import useStationaryGaze from "./useStationaryGaze";
import "./stationaryCatMascot.css";

const DEFAULT_MESSAGES = ["I'm right here. Keep going—I'll let you know when something is saved or needs your attention."];

// Row offsets align the paws across the reference sheet's uneven row spacing.
const FRAMES = [
  ...Array.from({ length: 8 }, (_, column) => ({ column, top: 64 })),
  { column: 0, top: 382 }, // relaxed
  { column: 1, top: 382 }, // happy
  { column: 4, top: 382 }, // concerned
  { column: 5, top: 382 }, // wink
];

export default function StationaryCatMascot({ notification, pendingCount = 0, dismiss, messages = DEFAULT_MESSAGES }) {
  const anchorRef = useRef(null);
  const messagesRef = useRef(null);
  const greetingIndex = useRef(0);
  const gaze = useStationaryGaze(anchorRef);
  const [greeting, setGreeting] = useState(null);
  const message = notification || greeting;
  const pose = notification ? notification.danger ? 10 : 9 : greeting ? 11 : gaze;
  const close = () => {
    if (notification) dismiss(notification.id);
    setGreeting(null);
  };

  return createPortal(
    <div className="personal-dashboard stationary-cat-mascot">
      <Toast.Provider duration={8000} swipeDirection="right">
        {message && <Toast.Root
          key={message.id}
          open
          type={message.danger ? "foreground" : "background"}
          duration={message.danger ? Infinity : 8000}
          onOpenChange={(open) => { if (!open) close(); }}
          className="stationary-cat-mascot__bubble relative rounded-lg border bg-white p-4 text-sm shadow-lg"
          data-tone={message.danger ? "error" : "success"}
        >
          <div className="mb-2 flex items-center gap-2">
            {message.danger ? <TriangleAlert size={17} className="text-rose-700" aria-hidden="true"/> : message.tone === "celebrate" ? <PartyPopper size={17} className="text-emerald-700" aria-hidden="true"/> : notification ? <CheckCircle2 size={17} className="text-emerald-700" aria-hidden="true"/> : <MessageCircle size={17} className="text-[var(--pd-primary)]" aria-hidden="true"/>}
            <Toast.Title className="flex-1 font-semibold text-slate-950">Smokey Sr.</Toast.Title>
            <Toast.Close asChild><Button variant="ghost" size="icon-sm" aria-label="Dismiss Smokey's message"><X size={16}/></Button></Toast.Close>
          </div>
          <Toast.Description className="max-h-[35dvh] overflow-y-auto whitespace-pre-wrap break-words leading-6 text-slate-700">{message.message}</Toast.Description>
          {message.actionUrl && message.actionLabel && <Button asChild variant="link" size="sm" className="mt-2 px-0"><a href={message.actionUrl}>{message.actionLabel}</a></Button>}
          {pendingCount > 1 && <p className="mt-2 text-xs text-slate-500">{pendingCount - 1} more {pendingCount === 2 ? "message" : "messages"} waiting</p>}
        </Toast.Root>}
        <Toast.Viewport ref={messagesRef} className="stationary-cat-mascot__messages fixed z-[70] m-0 w-[calc(100%-2rem)] max-w-sm list-none p-0 outline-none" label="Smokey's notifications ({hotkey})"/>
      </Toast.Provider>
      <button
        ref={anchorRef}
        type="button"
        className="stationary-cat-mascot__cat fixed z-40 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pd-primary)]"
        aria-label={notification ? "Read Smokey Sr.'s notification" : "Say hello to Smokey Sr."}
        aria-expanded={Boolean(message)}
        onClick={() => {
          if (notification) { messagesRef.current?.focus(); return; }
          if (greeting) { setGreeting(null); return; }
          const choices = messages.length ? messages : DEFAULT_MESSAGES;
          const choice = choices[greetingIndex.current++ % choices.length];
          setGreeting({ ...(typeof choice === "string" ? { message: choice } : choice), id: `greeting-${Date.now()}` });
        }}
      >
        {FRAMES.map((frame, index) => <span
          key={index}
          aria-hidden="true"
          className="stationary-cat-mascot__pose"
          data-active={index === pose}
          style={{ "--frame-column": frame.column, "--frame-top": frame.top }}
        />)}
      </button>
    </div>,
    document.body,
  );
}
