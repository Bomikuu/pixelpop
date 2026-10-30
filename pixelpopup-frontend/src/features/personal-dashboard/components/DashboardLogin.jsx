import { useState } from "react";
import { Eye, EyeOff, LogIn, ShieldCheck, TriangleAlert } from "lucide-react";
import { financeApi } from "../api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import ThemeToggle from "../../../ui/theme/ThemeToggle";

export default function DashboardLogin({ onSignedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [errors, setErrors] = useState({});
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const invalid = {};
    if (!username.trim()) invalid.username = "Enter your Django username.";
    if (!password) invalid.password = "Enter your password.";
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setShowPassword(false);
    setBusy(true);
    try {
      const session = await financeApi("session/login/");
      if (!session?.csrfToken) throw new Error("Could not initialize secure sign-in. Refresh and try again.");
      await financeApi("session/login/", { method: "POST", body: { username: username.trim(), password } }, session.csrfToken);
      setPassword("");
      setSignedIn(true);
      onSignedIn();
    } catch (failure) {
      setPassword("");
      setErrors({ common: failure.message });
      setBusy(false);
    }
  }
  return <>
    <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ backgroundImage: "radial-gradient(circle, var(--pd-primary) 1px, transparent 1px)", backgroundSize: "24px 24px", opacity: 0.12 }} />
    <section className="relative w-full max-w-sm rounded-xl border border-[var(--pd-border)] bg-white p-6 text-left sm:p-8">
    <div className="mb-4 flex items-center justify-between gap-3"><span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-700"><ShieldCheck aria-hidden="true" /></span><ThemeToggle /></div>
    <h1 className="text-2xl font-semibold text-slate-950">Sign in to your workspace</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Use the same username and password as your Django account.</p>
    <form noValidate onSubmit={submit} className="mt-6 space-y-4">
      {errors.common && <p role="alert" className="flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-900"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{errors.common}</p>}
      <div className="space-y-2"><Label htmlFor="workspace-username">Username *</Label><Input id="workspace-username" autoComplete="username" autoFocus maxLength={150} value={username} onChange={(event) => setUsername(event.target.value)} disabled={busy} aria-invalid={!!errors.username} aria-describedby={errors.username ? "workspace-username-error" : undefined} />{errors.username && <p id="workspace-username-error" className="text-sm text-red-800">{errors.username}</p>}</div>
      <div className="space-y-2">
        <Label htmlFor="workspace-password">Password *</Label>
        <div className="relative">
          <Input id="workspace-password" type={showPassword ? "text" : "password"} autoComplete="current-password" maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="h-11 pr-12" aria-invalid={!!errors.password} aria-describedby={errors.password ? "workspace-password-error" : undefined} />
          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-11 text-slate-600" disabled={busy} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="workspace-password" onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        </div>
        {errors.password && <p id="workspace-password-error" className="text-sm text-red-800">{errors.password}</p>}
      </div>
      <Button type="submit" disabled={busy} aria-busy={busy} className="min-h-11 w-full"><LogIn className="size-4" aria-hidden="true" />{signedIn ? "Opening your workspace…" : busy ? "Signing in…" : "Sign in"}</Button>
      <p role="status" className="text-xs leading-5 text-slate-600">{signedIn ? "Signed in successfully. Loading your dashboard." : "Your existing Django session also works here. No separate account is needed."}</p>
    </form>
    </section>
  </>;
}
