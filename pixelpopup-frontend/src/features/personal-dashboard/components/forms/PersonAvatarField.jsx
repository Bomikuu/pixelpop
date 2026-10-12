import { useEffect, useRef, useState } from "react";
import { ImagePlus, Info, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import PersonAvatar from "../PersonAvatar";
import { optimizePhoto } from "../../lib/imageUploads";

export default function PersonAvatarField({ id, value, existingAvatar, name, disabled, onChange, error }) {
  const [preview, setPreview] = useState(existingAvatar || "");
  const [issue, setIssue] = useState("");
  const input = useRef(null);
  const sequence = useRef(0);
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
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  const processing = value === "__processing__";
  return <div className="flex items-center gap-4 border-b border-[var(--pd-border)] pb-5">
    <PersonAvatar src={preview} name={name} alt="Avatar preview" className="size-20 text-xl sm:size-24" />
    <div className="min-w-0 flex-1 space-y-2">
      <p className="text-sm font-semibold">Avatar or logo <span className="font-normal text-slate-600">(optional)</span></p>
      <input ref={input} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={disabled} onChange={select} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={disabled || processing} aria-describedby={`${id}-help`}>
          {processing ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
          {processing ? "Preparing…" : preview ? "Replace image" : "Upload image"}
        </Button>
        {(preview || processing || issue) && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => {
          sequence.current++; setPreview(""); setIssue(""); if (input.current) input.current.value = ""; onChange("__remove__");
        }}><Trash2 className="size-4" aria-hidden="true" />Remove</Button>}
      </div>
      <p id={`${id}-help`} className="flex items-start gap-1.5 text-xs leading-5 text-slate-600"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />JPG, PNG or WebP · up to 10 MB. Private, resized, and saved only with this form.</p>
      {processing && <p role="status" className="sr-only">Preparing your image. Please wait before saving.</p>}
      {(issue || error) && <p id={`${id}-error`} role="alert" className="text-sm text-red-800">{issue || error}</p>}
    </div>
  </div>;
}
