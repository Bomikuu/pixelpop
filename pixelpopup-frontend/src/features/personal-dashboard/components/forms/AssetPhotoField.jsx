import { useEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import AssetImage from "../assets/AssetImage";
import { optimizePhoto } from "../../lib/imageUploads";

export default function AssetPhotoField({ id, value, existingImage, kind, disabled, onChange, error }) {
  const [preview, setPreview] = useState(existingImage || "");
  const [issue, setIssue] = useState("");
  const sequence = useRef(0);
  const input = useRef(null);
  useEffect(() => () => { sequence.current++; }, []);
  async function select(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const operation = ++sequence.current;
    setIssue("");
    onChange("__processing__");
    try {
      const photo = await optimizePhoto(file);
      if (operation !== sequence.current) return;
      setPreview(photo);
      onChange(photo);
    } catch (problem) {
      if (operation !== sequence.current) return;
      setIssue(problem.message || "Could not open this image. Choose another photo.");
      onChange("__invalid__");
    }
  }
  return <div className="flex flex-wrap items-start gap-4">
    <AssetImage src={preview} kind={kind} name="Asset preview" thumbnail className="h-24 w-32 shrink-0 rounded-md border border-[var(--pd-border)]" />
    <div className="min-w-0 flex-1 space-y-2">
      <Input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={select} aria-invalid={!!(issue || error)} aria-describedby={`${id}-help${issue ? ` ${id}-issue` : ""}${error ? ` ${id}-error` : ""}`} className="h-auto min-h-11 py-2" />
      <p id={`${id}-help`} className="flex gap-1.5 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />JPG, PNG or WebP, up to 10 MB. Resized to a private thumbnail of at most 256 KB; saved only with this form.</p>
      {value === "__processing__" && <p role="status" className="text-xs text-slate-600">Preparing photo…</p>}
      {issue && <p id={`${id}-issue`} role="alert" className="text-sm text-red-800">{issue}</p>}
      {(preview || value) && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { sequence.current++; setPreview(""); setIssue(""); if (input.current) input.current.value = ""; onChange("__remove__"); }}><X className="size-4" aria-hidden="true" />Remove photo</Button>}
    </div>
  </div>;
}
