import { useEffect, useState } from "react";
import { AlarmClock, Bell, BellOff, Check, Clock3, Info, Save } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

function initialValues(settings) {
  return {
    reminder_strict_mode: Boolean(settings?.reminder_strict_mode),
    reminder_interval_hours: Number(settings?.reminder_interval_hours || 1),
    reminder_start_time: (settings?.reminder_start_time || "09:00").slice(0, 5),
    reminder_end_time: (settings?.reminder_end_time || "00:00").slice(0, 5),
  };
}

export default function ReminderSettings({ settings, status, error, busy, onSave, onEnable, onDisable }) {
  const [values, setValues] = useState(() => initialValues(settings));
  const [saved, setSaved] = useState(false);
  useEffect(() => { setValues(initialValues(settings)); }, [settings]);
  const permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  const available = import.meta.env.PROD && status?.enabled;

  async function submit(event) {
    event.preventDefault();
    setSaved(false);
    try {
      await onSave(values);
      setSaved(true);
    } catch {
      // The hook provides the API error alongside this form.
    }
  }

  return <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5" aria-labelledby="reminder-settings-heading">
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[var(--pd-primary)]"><Bell size={18} aria-hidden="true" /></span>
      <div>
        <h2 id="reminder-settings-heading" className="text-base font-semibold text-slate-950">Important task reminders</h2>
        <p className="mt-1 text-sm text-slate-600">A checklist at the start of your day and a recap at the end. Completed tasks stay visible.</p>
      </div>
    </div>

    <form onSubmit={submit} className="mt-5 space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-900">Reminder style</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { value: false, title: "Start and recap", description: "One checklist in the morning and one end-of-day recap.", Icon: Clock3 },
            { value: true, title: "Strict Mode", description: "Repeat while tasks remain incomplete, within your time window.", Icon: AlarmClock },
          ].map(({ value, title, description, Icon }) => <button key={title} type="button" aria-pressed={values.reminder_strict_mode === value} onClick={() => setValues((current) => ({ ...current, reminder_strict_mode: value }))} className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pd-primary)] motion-reduce:transition-none ${values.reminder_strict_mode === value ? "border-[var(--pd-primary)] bg-blue-50/70" : "border-slate-200 bg-white hover:border-slate-400"}`}>
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white text-[var(--pd-primary)]"><Icon size={17} aria-hidden="true" /></span>
            <span><span className="block text-sm font-medium text-slate-950">{title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-600">{description}</span></span>
          </button>)}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium text-slate-900">Start time
          <Input type="time" value={values.reminder_start_time} onChange={(event) => setValues((current) => ({ ...current, reminder_start_time: event.target.value }))} required className="mt-2 border border-slate-300 bg-white" />
        </label>
        <label className="block text-sm font-medium text-slate-900">End time
          <Input type="time" value={values.reminder_end_time} onChange={(event) => setValues((current) => ({ ...current, reminder_end_time: event.target.value }))} required className="mt-2 border border-slate-300 bg-white" />
        </label>
        <label className="block text-sm font-medium text-slate-900">Strict interval
          <span className="block text-xs font-normal text-slate-600">Hours between repeats</span>
          <Input type="number" min="1" max="24" step="1" value={values.reminder_interval_hours} disabled={!values.reminder_strict_mode} onChange={(event) => setValues((current) => ({ ...current, reminder_interval_hours: Number(event.target.value) }))} className="mt-1 border border-slate-300 bg-white" />
        </label>
      </div>
      <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />Times use Asia/Manila. Midnight is the recap for the day that just ended. Production checks run every 30 minutes, so a custom time may arrive up to 30 minutes later.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}><Save size={16} aria-hidden="true" />Save reminder settings</Button>
        {saved && <span role="status" className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check size={16} aria-hidden="true" />Saved</span>}
      </div>
    </form>

    <div className="mt-5 border-t border-slate-200 pt-5">
      <h3 className="text-sm font-semibold text-slate-950">Browser notifications</h3>
      <p className="mt-1 text-sm text-slate-600">Get a notification when this dashboard tab is closed. You can still see popups here without browser permission.</p>
      <p className="mt-2 text-xs text-slate-600" role="status">{!import.meta.env.PROD ? "Available after production deployment." : !status?.enabled ? "Not configured on the production server yet." : permission === "denied" ? "Blocked in browser settings. Allow this site there to enable notifications." : permission === "unsupported" ? "This browser does not support Web Push." : status?.device_subscribed ? "Notifications are enabled on this browser." : status?.subscribed ? "Enabled on another browser, but not this one." : "Not enabled on this browser."}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={!available || busy || permission === "denied" || permission === "unsupported"} onClick={onEnable}><Bell size={16} aria-hidden="true" />Enable notifications</Button>
        {status?.device_subscribed && <Button type="button" variant="ghost" disabled={busy} onClick={onDisable}><BellOff size={16} aria-hidden="true" />Disable on this browser</Button>}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">On iPhone or iPad, background notifications require adding this site to your Home Screen. Delivery after fully quitting a browser also depends on your device.</p>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  </section>;
}
