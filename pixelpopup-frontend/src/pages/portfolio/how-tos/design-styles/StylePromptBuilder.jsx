import { useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { buildStylePrompt } from "./styleRecipes";

export default function StylePromptBuilder({ style, recipe }) {
  const [mode, setMode] = useState("interface");
  const [subject, setSubject] = useState("an interactive learning workspace");
  const [audience, setAudience] = useState("people learning a new skill");
  const [palette, setPalette] = useState("");
  const [action, setAction] = useState("Continue lesson");
  const [copyState, setCopyState] = useState({ prompt: "", status: "idle" });
  const outputRef = useRef(null);
  const prompt = buildStylePrompt({ style, recipe, mode, subject, audience, palette, action });
  const currentStatus = copyState.prompt === prompt ? copyState.status : "idle";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState({ prompt, status: "copied" });
    } catch {
      outputRef.current?.focus();
      outputRef.current?.select();
      setCopyState({ prompt, status: "manual" });
    }
  };

  const download = () => {
    const content = `# ${style.title}: ${mode === "interface" ? "interface" : "illustration"} prompt\n\n${prompt}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${style.slug}-${mode}-prompt.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="dsg-prompt-builder" aria-labelledby="dsg-prompt-title">
    <h3 id="dsg-prompt-title">Make it your prompt</h3>
    <p>Start with {style.title}, then describe the actual thing you need. Your prompt updates as you edit.</p>
    <fieldset className="dsg-output-type"><legend>What should the AI make?</legend>{[["interface", "An interface"], ["illustration", "An illustration"]].map(([value, label]) => <label key={value}><input type="radio" name="dsg-output-type" value={value} checked={mode === value} onChange={() => setMode(value)} /><span>{label}</span></label>)}</fieldset>
    <div className="dsg-builder-fields">
      <label htmlFor="dsg-subject">What are you making?<input id="dsg-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={240} /></label>
      <label htmlFor="dsg-audience">Who is it for?<input id="dsg-audience" value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={200} /></label>
      <label htmlFor="dsg-palette">Palette <span>(optional)</span><input id="dsg-palette" value={palette} onChange={(event) => setPalette(event.target.value)} placeholder={recipe.palette} aria-describedby="dsg-palette-help" maxLength={240} /></label>
      <label htmlFor="dsg-action">Main action label<input id="dsg-action" value={action} onChange={(event) => setAction(event.target.value)} maxLength={100} /></label>
    </div>
    <p id="dsg-palette-help" className="dsg-field-help">Leave the palette empty to use this style’s suggested colors.</p>
    <div className="dsg-prompt-output"><label htmlFor="dsg-prompt-output">Your {mode === "interface" ? "interface" : "illustration"} prompt</label><textarea id="dsg-prompt-output" ref={outputRef} value={prompt} readOnly rows={15} spellCheck={false} aria-describedby="dsg-prompt-help" /></div>
    <div className="dsg-prompt-actions"><button type="button" className="dsg-button primary" onClick={copy}>{currentStatus === "copied" ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{currentStatus === "copied" ? "Copied" : "Copy prompt"}</button><button type="button" className="dsg-button" onClick={download}><Download size={17} aria-hidden="true" />Save .md</button></div>
    <p className="dsg-copy-status" role="status" aria-live="polite">{currentStatus === "copied" ? "Prompt copied. Paste it into your preferred AI tool." : currentStatus === "manual" ? "Clipboard access is unavailable. The prompt is selected; use your device’s Copy command." : ""}</p>
    <p id="dsg-prompt-help" className="dsg-field-help">This builds a reusable brief. It does not send anything to an AI service.</p>
  </section>;
}
