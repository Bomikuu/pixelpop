import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Panel } from "./Panel";
import PersonAvatarField from "./forms/PersonAvatarField";

const profileFields = [
  { key: "first_name", label: "First name", autoComplete: "given-name", maxLength: 150 },
  { key: "last_name", label: "Last name", autoComplete: "family-name", maxLength: 150 },
  { key: "email", label: "Email", autoComplete: "email", type: "email", maxLength: 254 },
];
const fieldMessage = (value) => Array.isArray(value) ? value.join(" ") : value;

export default function UserProfileSettings({ user, request, onSaved, draftRef, onSavingChange }) {
  const draft = draftRef.current?.userId === user.id ? draftRef.current : null;
  const [saved, setSaved] = useState(() => draft?.saved || user);
  const [values, setValues] = useState(() => draft?.values || Object.fromEntries(profileFields.map(({ key }) => [key, user[key] || ""])));
  const [upload, setUpload] = useState(() => draft?.upload === "__processing__" ? undefined : draft?.upload);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const pending = useRef(false);
  const changed = upload !== undefined || profileFields.some(({ key }) => values[key] !== (saved[key] || ""));
  const ready = changed && !["__processing__", "__invalid__"].includes(upload);
  useEffect(() => {
    draftRef.current = { userId: user.id, saved, values, upload, dirty: changed, saving };
  }, [draftRef, user.id, saved, values, upload, changed, saving]);
  useEffect(() => {
    if (!changed && !saving) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed, saving]);

  function reset() {
    setValues(Object.fromEntries(profileFields.map(({ key }) => [key, saved[key] || ""])));
    setUpload(undefined);
    setPhotoVersion((version) => version + 1);
    setErrors({});
    setError("");
  }

  async function save(event) {
    event.preventDefault();
    if (!ready || pending.current) return;
    pending.current = true;
    setSaving(true);
    onSavingChange(true);
    setError("");
    setErrors({});
    try {
      const body = { ...values };
      if (upload !== undefined) body.avatar_upload = upload === "__remove__" ? null : upload;
      const result = await request("session/", { method: "PATCH", body });
      if (draftRef.current?.userId === user.id) draftRef.current = null;
      setSaved(result.user);
      setValues(Object.fromEntries(profileFields.map(({ key }) => [key, result.user[key] || ""])));
      setUpload(undefined);
      onSaved();
    } catch (failure) {
      setErrors(failure.fields || {});
      if (![...profileFields.map(({ key }) => key), "avatar_upload"].some((key) => failure.fields?.[key])) {
        setError(fieldMessage(failure.fields?.non_field_errors) || failure.message);
      }
    } finally {
      pending.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  }

  return <Panel title="Profile" description="Update your name, email, and sidebar photo.">
    <form onSubmit={save} className="max-w-2xl space-y-5" aria-busy={saving}>
      <PersonAvatarField key={photoVersion} id="user-avatar-upload" label="Profile photo" value={upload} existingAvatar={upload && !upload.startsWith("__") ? upload : upload === "__remove__" ? null : saved.avatar_url} name={`${values.first_name} ${values.last_name}`.trim() || saved.name} disabled={saving} onChange={(value) => {
        setUpload(value);
        setErrors((current) => ({ ...current, avatar_upload: undefined }));
        setError("");
      }} error={fieldMessage(errors.avatar_upload)} />
      <div className="grid gap-5 sm:grid-cols-2">
        {profileFields.map(({ key, label, ...props }) => <div key={key} className={"space-y-2 " + (key === "email" ? "sm:col-span-2" : "")}>
          <Label htmlFor={`profile-${key}`}>{label}</Label>
          <Input {...props} id={`profile-${key}`} name={key} value={values[key]} disabled={saving} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `profile-${key}-error` : undefined} onChange={(event) => {
            setValues((current) => ({ ...current, [key]: event.target.value }));
            setErrors((current) => ({ ...current, [key]: undefined }));
            setError("");
          }} />
          {errors[key] && <p id={`profile-${key}-error`} role="alert" className="text-sm text-red-800">{fieldMessage(errors[key])}</p>}
        </div>)}
      </div>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!ready || saving}>{saving ? "Saving…" : "Save profile"}</Button>
        <Button type="button" variant="outline" disabled={!changed || saving} onClick={reset}>Reset changes</Button>
        <p role="status" className="text-sm text-slate-600">{saving ? "Saving your profile…" : changed ? "You have unsaved changes." : "All changes saved."}</p>
      </div>
    </form>
  </Panel>;
}
