import { Download } from "lucide-react";
import { Button } from "../personal-dashboard/ui/button";

export default function WorkspacePwaControls({ pwa }) {
  return <section aria-label="Workspace app" className="mt-4 space-y-3 border-t px-3 pt-4 text-xs leading-5 text-slate-600">
    {pwa.canInstall || pwa.installing ? <Button type="button" variant="outline" className="min-h-11 w-full" disabled={pwa.installing} onClick={pwa.install}><Download size={16}/>{pwa.installing ? "Opening installation…" : "Install workspace"}</Button>
      : !pwa.installed && <details><summary className="cursor-pointer rounded-sm py-2 font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)]">Install on your phone</summary><p className="mt-2">On iPhone or iPad, open your browser’s Share menu and choose Add to Home Screen. On Android, use the browser menu’s Install app or Add to Home screen option when available.</p></details>}
    {!pwa.online && <p role="status">Your device appears offline. Reconnect before saving or loading private records.</p>}
    {pwa.updateAvailable && <p role="status">Update available. Save your changes and close workspace windows to update.</p>}
    {pwa.error && <p role="status">{pwa.error}</p>}
    {pwa.installed && !pwa.updateAvailable && <p>Workspace app installed</p>}
  </section>;
}
