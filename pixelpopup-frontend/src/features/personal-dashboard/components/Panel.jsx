import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Inbox, LoaderCircle } from "lucide-react";

export function LoadingState({ message = "Loading your workspace…", className = "" }) {
  return <div role="status" aria-live="polite" aria-busy="true" className={`flex min-h-48 w-full flex-col items-center justify-center gap-3 px-4 py-10 text-center text-sm text-[var(--pd-muted)] ${className}`}>
    <LoaderCircle className="size-8 text-[var(--pd-primary)] motion-safe:animate-spin" aria-hidden="true" />
    <span>{message}</span>
  </div>;
}

export function Panel({ title, description, action, children, contentClassName }) {
  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message = "Add your first record to get started.",
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="py-9 text-center">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-blue-50 text-[var(--pd-primary)]">
        <Icon size={24} aria-hidden="true" />
      </span>
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {message}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <p>{message}</p>
      {retry && (
        <Button variant="outline" className="mt-3" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
