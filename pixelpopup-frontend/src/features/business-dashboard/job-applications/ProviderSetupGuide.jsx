import { useState } from "react";
import { ArrowRight, Check, ClipboardCheck, Cloud, Copy, ExternalLink, Info, KeyRound, Laptop, Settings2, ShieldCheck, X } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../personal-dashboard/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../personal-dashboard/ui/tabs";
import { copyDocument } from "../client-workflow/shared";
import ProviderIcon from "./ProviderIcon";

const guides = {
  openai: {
    keys: "https://platform.openai.com/api-keys",
    docs: "https://developers.openai.com/api/docs/quickstart",
    billing: "Enable API billing in OpenAI Platform. Your ChatGPT subscription does not fund API requests.",
    detail: "Choose Luna for routine drafts and Sol when you want a more detailed refinement. Only the selected model is called.",
  },
  gemini: {
    keys: "https://aistudio.google.com/apikey",
    docs: "https://ai.google.dev/gemini-api/docs/api-key",
    billing: "Create a Gemini API key for a Google project. Check that project's billing, available models and rate limits; free-tier limits and data policies differ from paid use.",
    detail: "Use the Gemini API key, not a Google account password or Gemini app subscription. Review data terms before sending private résumé information.",
  },
  anthropic: {
    keys: "https://console.anthropic.com/",
    docs: "https://platform.claude.com/docs/en/api/overview",
    billing: "Create an API key and add API credits in the Anthropic Console. A Claude chat subscription is separate from API billing.",
    detail: "Choose Haiku for first drafts or Sonnet for detailed refinement. The existing draft and approval flow stay unchanged.",
  },
  openrouter: {
    keys: "https://openrouter.ai/settings/keys",
    docs: "https://openrouter.ai/docs/quickstart",
    billing: "Add credits in OpenRouter, then create an API key with a spending limit. Credit-purchase fees are separate from token estimates.",
    detail: "The initial models are Luna and Sol, pinned to the OpenAI provider. Fallbacks are disabled, supported parameters are required, and data-collection routing is denied. These restrictions can make a route unavailable; we do not relax them automatically.",
  },
  deepseek: {
    keys: "https://platform.deepseek.com/",
    docs: "https://api-docs.deepseek.com/",
    billing: "Create a DeepSeek API key and top up your API balance. Access to the DeepSeek chat app is not an API balance.",
    detail: "Choose Flash for routine drafts or Pro for detailed drafting. Thinking is disabled for this document flow. Quotes use peak uncached rates; off-peak and caching can reduce actual charges. Review the vendor's data policy before sharing private information.",
  },
};

const setupFlow = [
  { label: "Get API key", icon: KeyRound },
  { label: "Configure Django", icon: Cloud },
  { label: "Select model", icon: Settings2 },
  { label: "Review draft", icon: ClipboardCheck },
];

function SetupStep({ number, icon: Icon, title, children }) {
  return <li className="flex min-w-0 gap-3 py-4 first:pt-0 last:pb-0">
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--pd-soft)] text-xs font-medium text-[var(--pd-primary)]" aria-hidden="true">{number}</span>
    <div className="min-w-0 flex-1 space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </div>
  </li>;
}

export default function ProviderSetupGuide({ provider, notify }) {
  const [open, setOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const guide = guides[provider?.id];
  if (!guide) return null;
  const example = `${provider.key_name}=your-api-key`;
  const copyExample = () => copyDocument(example, (message) => { setCopyMessage(message); notify?.(message); });
  const linkClass = "inline-flex items-center gap-1 text-blue-700 underline underline-offset-4 hover:text-blue-900 focus-visible:outline-blue-600";
  return <section className="border-t pt-3">
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setCopyMessage(""); }}>
      <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><ProviderIcon provider={provider.id} size={16}/>{provider.label} setup guide</Button></DialogTrigger>
      <DialogContent className="personal-dashboard flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 text-slate-700 sm:max-w-3xl motion-reduce:animate-none">
        <DialogHeader className="shrink-0 border-b p-4 pr-12 text-left sm:p-6 sm:pr-12">
          <DialogTitle className="flex items-center gap-2"><ProviderIcon provider={provider.id} size={24}/>Connect {provider.label}</DialogTitle>
          <DialogDescription>Follow these four steps. This guide does not collect or save your API key.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto p-4 text-sm leading-6 sm:p-6">
          <ol aria-label="Setup flow" className="mb-6 grid grid-cols-2 gap-3 border-b pb-5 sm:grid-cols-4">
            {setupFlow.map(({ label, icon: Icon }, index) => <li key={label} className="flex min-w-0 items-center gap-2">
              <Icon size={18} className="shrink-0 text-[var(--pd-primary)]" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-800">{label}</span>
              {index < setupFlow.length - 1 && <ArrowRight size={14} className="ml-auto hidden shrink-0 text-slate-400 sm:block" aria-hidden="true" />}
            </li>)}
          </ol>
          <ol className="divide-y">
            <SetupStep number={1} icon={KeyRound} title="Create your vendor API key">
              <p>{guide.billing}</p>
              <Button asChild variant="outline" size="sm" className="h-auto max-w-full whitespace-normal py-2"><a href={guide.keys} target="_blank" rel="noopener noreferrer"><KeyRound size={15} aria-hidden="true" />Open {provider.label} API keys<ExternalLink size={13} aria-hidden="true" /></a></Button>
              <p className="text-xs text-slate-600">Keep the real key in your backend environment—not in this dashboard.</p>
            </SetupStep>
            <SetupStep number={2} icon={Cloud} title="Add the key to Django">
              <Tabs defaultValue="local" className="gap-3">
                <TabsList aria-label="Where to configure the API key" className="h-auto w-full flex-wrap"><TabsTrigger value="local" className="h-8"><Laptop aria-hidden="true" />Local</TabsTrigger><TabsTrigger value="vercel" className="h-8"><Cloud aria-hidden="true" />Vercel production</TabsTrigger></TabsList>
                <TabsContent value="local" className="space-y-3">
                  <p>Open <code>backendv2/.env</code> and add this line. Replace <code>your-api-key</code> with the key from step 1.</p>
                  <div className="overflow-hidden rounded-md border bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><span className="text-xs font-medium">backendv2/.env</span><Button type="button" variant="ghost" size="sm" onClick={copyExample}><Copy size={14} aria-hidden="true" />Copy example</Button></div>
                    <pre className="overflow-x-auto p-3 text-xs text-slate-950"><code>{example}</code></pre>
                  </div>
                  <p className="flex items-start gap-2 text-xs text-slate-600"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><span>Save the file and restart Django so it loads the new variable. Leave other environment values unchanged.</span></p>
                </TabsContent>
                <TabsContent value="vercel" className="space-y-3">
                  <p>Open your <strong>backend</strong> Vercel project, then go to Settings → Environment Variables. Add these values:</p>
                  <dl className="divide-y rounded-md border bg-white px-3">
                    <div className="py-2"><dt className="text-xs text-slate-600">Key / Name</dt><dd className="break-all font-mono text-xs text-slate-950">{provider.key_name}</dd></div>
                    <div className="py-2"><dt className="text-xs text-slate-600">Value</dt><dd>Your real API key from step 1</dd></div>
                    <div className="py-2"><dt className="text-xs text-slate-600">Environment</dt><dd>Production</dd></div>
                  </dl>
                  <Button type="button" variant="outline" size="sm" className="h-auto max-w-full whitespace-normal py-2" onClick={copyExample}><Copy size={14} aria-hidden="true" />Copy environment example</Button>
                  <p className="flex items-start gap-2 text-xs text-slate-600"><Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><span>Save the variable, then redeploy the backend. Add it separately to Preview only if you want preview deployments to use this vendor. Do not add it to the frontend project.</span></p>
                </TabsContent>
              </Tabs>
              <p role="status" className="min-h-5 text-xs text-slate-600">{copyMessage}</p>
            </SetupStep>
            <SetupStep number={3} icon={Settings2} title="Choose a model and save settings">
              <p>Close this guide, select your generation model and optional refinement model, then set your monthly USD allowance and choose <strong>Save AI settings</strong>.</p>
              <p className="flex items-start gap-2 rounded-md border bg-[var(--pd-soft)] p-3"><Info size={16} className="mt-1 shrink-0 text-[var(--pd-primary)]" aria-hidden="true" /><span>{guide.detail}</span></p>
              <p className="text-xs text-slate-600">“Server API key present” only checks that a key exists—not whether it is valid or has credit.</p>
            </SetupStep>
            <SetupStep number={4} icon={ClipboardCheck} title="Generate one section and review it">
              <p>Confirm your profile sources, open an application and generate one section. Check the cost quote before proceeding, review the draft proposal, then check AI usage and vendor billing.</p>
              <p className="flex items-center gap-2 text-xs text-slate-600"><Check size={15} className="shrink-0" aria-hidden="true" />Your existing saved drafts remain available when you change providers.</p>
            </SetupStep>
          </ol>
          <div className="mt-5 flex items-start gap-2 rounded-md border p-3 text-xs leading-5"><ShieldCheck size={18} className="shrink-0 text-[var(--pd-primary)]" aria-hidden="true" /><p>Never commit your .env or expose keys through VITE_ variables or screenshots. Generation sends your approved profile, résumé text and posting to the selected vendor. Review its data policy; routing restrictions are not a blanket privacy guarantee.</p></div>
        </div>
        <DialogFooter className="shrink-0 items-center border-t p-4 sm:justify-between">
          <a href={guide.docs} target="_blank" rel="noopener noreferrer" className={`${linkClass} text-xs`}>Official vendor documentation<ExternalLink size={13} aria-hidden="true" /></a>
          <DialogClose asChild><Button type="button" variant="outline"><X size={15} aria-hidden="true" />Close guide</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
