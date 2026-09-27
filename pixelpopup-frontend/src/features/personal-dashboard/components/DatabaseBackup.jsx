import { useEffect, useRef, useState } from "react";
import {
  DatabaseBackup as BackupIcon,
  Download,
  ShieldCheck,
} from "lucide-react";
import { financeApi } from "../api";
import { Button } from "../ui/button";
import { Panel } from "./Panel";

export default function DatabaseBackup({ allowed, notify }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function download() {
    if (request.current || !allowed) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const result = await financeApi("backup/", {
        download: true,
        signal: controller.signal,
      });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Full database backup download started. Store it securely.");
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e.message);
        notify(e.message, { tone: "error" });
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      request.current = null;
    }
  }
  return (
    <Panel
      title="Full database backup"
      description="Download all database tables, including users, dashboard records and site data."
      action={
        <Button onClick={download} disabled={busy || !allowed}>
          <Download aria-hidden="true" />
          {busy ? "Preparing backup…" : "Download full backup"}
        </Button>
      }
    >
      <div className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <BackupIcon
          className="mt-1 size-6 shrink-0 text-[var(--pd-primary)]"
          aria-hidden="true"
        />
        <div>
          <p>
            This unencrypted file contains sensitive data, including password
            hashes and sessions. Store it in a secure location and never commit
            or share it publicly.
          </p>
          <p className="mt-2">
            Restoration is manual using SQLite or PostgreSQL tools. Uploaded
            files, source code and environment secrets are not stored in the
            database and need separate backups.
          </p>
          {!allowed && (
            <p className="mt-3 flex items-center gap-2 font-medium text-slate-950">
              <ShieldCheck size={16} aria-hidden="true" />
              Only a Django admin account can download a full backup.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 text-red-800">
              {error}
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
