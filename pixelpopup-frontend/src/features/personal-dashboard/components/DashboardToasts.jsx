import { Toast } from "radix-ui";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";

export default function DashboardToasts({ notices, dismiss }) {
  return (
    <Toast.Provider duration={5000} swipeDirection="right">
      {notices.map((notice) => (
        <Toast.Root
          key={notice.id}
          open
          type="background"
          onOpenChange={(open) => {
            if (!open) dismiss(notice.id);
          }}
          data-dashboard-toast
          className="personal-dashboard flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in data-[swipe=end]:animate-out data-[swipe=end]:fade-out motion-reduce:animate-none"
        >
          {notice.tone === "error" ? (
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-red-700"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 size-5 shrink-0 text-[var(--pd-primary)]"
              aria-hidden="true"
            />
          )}
          <Toast.Description className="min-w-0 flex-1 text-sm leading-6">
            {notice.text}
          </Toast.Description>
          <Toast.Close
            aria-label="Dismiss notification"
            className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <X size={16} aria-hidden="true" />
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport
        className="fixed bottom-4 right-4 z-[70] m-0 flex w-[calc(100%-2rem)] max-w-sm list-none flex-col gap-2 p-0 outline-none"
        label="Notifications ({hotkey})"
      />
    </Toast.Provider>
  );
}
