import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "../../ui/button";

export default function CopyAiFormatButton({ prompt, disabled = false }) {
  const [copiedPrompt, setCopiedPrompt] = useState("");
  const [error, setError] = useState(false);
  const copied = copiedPrompt === prompt;

  async function copyFormat() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      setError(false);
    } catch {
      setCopiedPrompt("");
      setError(true);
    }
  }

  return <span className="inline-flex flex-wrap items-center gap-2">
    <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={copyFormat}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? "Copied for AI" : "Copy format for AI"}
    </Button>
    <span className="sr-only" role="status">{copied ? "AI format copied to clipboard." : ""}</span>
    {error && <span role="alert" className="text-xs text-red-800">Clipboard access blocked. Allow access and try again.</span>}
  </span>;
}
