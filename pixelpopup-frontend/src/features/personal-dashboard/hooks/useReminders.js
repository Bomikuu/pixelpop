import { useCallback, useEffect, useState } from "react";

function applicationKey(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export function useReminders({ request, ready, version, refresh }) {
  const [checklist, setChecklist] = useState(null);
  const [status, setStatus] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadChecklist = useCallback(async (date) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const data = await request("reminders/checklist/" + query);
    if (!date) setChecklist(data);
    return data;
  }, [request]);

  const loadStatus = useCallback(async () => {
    const data = await request("reminders/status/");
    let deviceSubscription = null;
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/dashboard/") : null;
      deviceSubscription = await registration?.pushManager.getSubscription();
    } catch {
      // Keep the backend status visible when this browser blocks push APIs.
    }
    const result = { ...data, device_subscribed: Boolean(deviceSubscription) };
    setStatus(result);
    return result;
  }, [request]);

  const checkPending = useCallback(async () => {
    if (!import.meta.env.PROD || !document.hasFocus()) return;
    const { delivery } = await request("reminders/pending/");
    if (!delivery) return;
    const result = await request(`reminders/deliveries/${delivery.id}/claim/`, { method: "POST", body: {} });
    if (result.claimed) {
      setDialog({ phase: result.phase, checklist: result.checklist });
      setChecklist(result.checklist);
    }
  }, [request]);

  useEffect(() => {
    if (!ready) return;
    loadChecklist().catch((problem) => setError(problem.message));
    loadStatus().catch((problem) => setError(problem.message));
  }, [ready, version, loadChecklist, loadStatus]);

  useEffect(() => {
    if (!ready || !import.meta.env.PROD) return;
    const inspect = () => checkPending().catch((problem) => setError(problem.message));
    const focused = () => { if (document.hasFocus()) inspect(); };
    const message = (event) => { if (event.data?.type === "personal-reminder") inspect(); };
    inspect();
    window.addEventListener("focus", focused);
    navigator.serviceWorker?.addEventListener("message", message);
    const interval = window.setInterval(inspect, 5 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", focused);
      navigator.serviceWorker?.removeEventListener("message", message);
      window.clearInterval(interval);
    };
  }, [ready, checkPending]);

  const openChecklist = useCallback(async () => {
    setError("");
    try {
      setDialog({ phase: "manual", checklist: await loadChecklist() });
    } catch (problem) {
      setError(problem.message);
    }
  }, [loadChecklist]);

  const toggle = useCallback(async (id) => {
    if (!dialog) return;
    setBusy(true);
    setError("");
    try {
      await request(`reminders/items/${id}/toggle/`, { method: "POST", body: {} });
      const updated = await loadChecklist(dialog.checklist.date);
      setDialog((current) => current ? { ...current, checklist: updated } : null);
      if (updated.date === checklist?.date) setChecklist(updated);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }, [checklist?.date, dialog, loadChecklist, request]);

  const saveSettings = useCallback(async (values) => {
    setBusy(true);
    setError("");
    try {
      const saved = await request("settings/", { method: "PATCH", body: values });
      refresh();
      return saved;
    } catch (problem) {
      setError(problem.message);
      throw problem;
    } finally {
      setBusy(false);
    }
  }, [refresh, request]);

  const enablePush = useCallback(async () => {
    setError("");
    if (!status?.enabled || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Browser notifications are unavailable here. The in-app checklist still works.");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted. You can still use the in-app checklist.");
      const registration = await navigator.serviceWorker.register("/dashboard-reminders-sw.js", { scope: "/dashboard/" });
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationKey(status.vapid_public_key),
      });
      await request("reminders/subscriptions/", { method: "POST", body: subscription.toJSON() });
      await loadStatus();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }, [loadStatus, request, status]);

  const disablePush = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/dashboard/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await request("reminders/subscriptions/", { method: "DELETE", body: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      await loadStatus();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }, [loadStatus, request]);

  return {
    checklist, status, dialog, error, busy,
    close: () => setDialog(null), openChecklist, toggle, saveSettings,
    enablePush, disablePush,
  };
}
