import { useEffect, useState } from "react";
import { CheckCircle2, Info, Save } from "lucide-react";
import { Panel, ErrorState } from "../../personal-dashboard/components/Panel";
import { Button } from "../../personal-dashboard/ui/button";
import { Label } from "../../personal-dashboard/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../personal-dashboard/ui/select";
import { fieldError, jobApi } from "./api";
import ChoiceTiles from "../../personal-dashboard/components/ChoiceTiles";
import { Field } from "../client-workflow/shared";
import ApplicationUsage from "./ApplicationUsage";
import ProviderSetupGuide from "./ProviderSetupGuide";

import { providerIcons } from "./ProviderIcon";

export default function ApplicationAISettings({ notify }) {
  const [data, setData] = useState(null), [draft, setDraft] = useState(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [errors, setErrors] = useState({});
  useEffect(() => { const controller = new AbortController(); jobApi("settings/", { signal: controller.signal }).then((result) => { setData(result); setDraft(result.settings); }).catch((issue) => { if (!controller.signal.aborted) setError(issue.message); }); return () => controller.abort(); }, []);
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setErrors({});
    try { const result = await jobApi("settings/", { method: "PATCH", body: { ...draft, monthly_budget_usd: draft.monthly_budget_usd === "" ? null : draft.monthly_budget_usd, expected_version: draft.version } }); setData(result); setDraft(result.settings); notify("Application AI settings saved."); }
    catch (issue) { setError(fieldError(issue.fields, "model") || issue.message); setErrors(issue.fields || {}); }
    finally { setBusy(false); }
  }
  const provider = data?.providers.find((item) => item.id === draft?.provider);
  return <div className="space-y-4"><Panel title="Application AI" description="Choose the API provider and models used for your job application drafts.">
    {error && <ErrorState message={error}/>}
    {!draft ? !error && <p className="text-sm text-slate-600">Loading provider settings…</p> : <form noValidate onSubmit={save} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Choose your AI provider</p>
        <ChoiceTiles id="application-provider" label="AI provider" value={draft.provider} disabled={busy} avatarChoices
          options={data.providers.map((item) => ({ value: item.id, label: item.label, icon: providerIcons[item.id], description: item.configured ? "Server API key present" : "Add a server API key to generate" }))}
          onChange={(value) => setDraft({ ...draft, provider: value, model: data.providers.find((item) => item.id === value).models[0].id, refinement_model: "" })}/>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="application-model" className="mb-2 block">Generation model</Label><Select value={draft.model} disabled={busy} onValueChange={(model) => setDraft({ ...draft, model })}><SelectTrigger id="application-model" className="w-full"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard">{provider?.models.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs leading-5 text-slate-600">{provider?.models.find((item) => item.id === draft.model)?.description}</p></div>
        <div><Label htmlFor="application-refine-model" className="mb-2 block">Refinement model</Label><Select value={draft.refinement_model || "same"} disabled={busy} onValueChange={(value) => setDraft({ ...draft, refinement_model: value === "same" ? "" : value })}><SelectTrigger id="application-refine-model" className="w-full"><SelectValue/></SelectTrigger><SelectContent className="personal-dashboard"><SelectItem value="same">Use generation model</SelectItem>{provider?.models.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
      </div>
      {provider && !provider.models.some((item) => item.id === draft.model) && <p role="alert" className="text-sm text-red-800">Your saved model is no longer supported. Choose a model explicitly before generating.</p>}
      <div className="max-w-sm"><Field label="Monthly budget (USD, optional)" name="monthly_budget_usd" type="money" value={draft.monthly_budget_usd ?? ""} disabled={busy} onChange={(_, value) => setDraft({ ...draft, monthly_budget_usd: value })} error={fieldError(errors, "monthly_budget_usd")}/><p className="mt-1 text-xs leading-5 text-slate-600">Shared across providers and applications. Leave blank for no app limit; enter 0 to pause generation. Month boundaries use Asia/Manila.</p></div>
      {provider?.models.find((item) => item.id === draft.model)?.note && <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Info size={15} className="shrink-0"/><span>{provider.models.find((item) => item.id === draft.model).note}</span></p>}
      <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${provider?.configured ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{provider?.configured ? <CheckCircle2 size={18} className="shrink-0"/> : <Info size={18} className="shrink-0"/>}<div>{provider?.configured ? `${provider.label} credentials are configured.` : `Set ${provider?.key_name} in the Django backend environment to enable this provider.`}<p className="mt-1 text-xs">Your key stays on the server. Changing provider affects future generations. Saved drafts stay available.</p></div></div>
      <ProviderSetupGuide key={draft.provider} provider={provider} notify={notify}/>
      <div className="flex items-center justify-between gap-3 border-t pt-3"><p className="text-xs text-slate-600">Refinement runs only when you request it. Usage estimates appear in each application.</p><Button type="submit" disabled={busy}><Save size={16}/>{busy ? "Saving…" : "Save AI settings"}</Button></div>
    </form>}
  </Panel><ApplicationUsage refreshKey={data?.settings?.version} notify={notify}/></div>;
}
