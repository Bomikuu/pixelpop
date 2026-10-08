import { useRef } from "react";
import { Bold, Heading1, Heading2, Italic, Link2, List, ListOrdered, Minus, Table2 } from "lucide-react";
import { Button } from "../../personal-dashboard/ui/button";
import { Textarea } from "../../personal-dashboard/ui/textarea";

const commands = [
  [
    { key: "heading1", label: "Heading 1", icon: Heading1 },
    { key: "heading2", label: "Heading 2", icon: Heading2 },
  ],
  [
    { key: "bold", label: "Bold", icon: Bold },
    { key: "italic", label: "Italic", icon: Italic },
  ],
  [
    { key: "bullet", label: "Bullet list", icon: List },
    { key: "numbered", label: "Numbered list", icon: ListOrdered },
  ],
  [
    { key: "link", label: "Insert link", icon: Link2 },
    { key: "table", label: "Insert table", icon: Table2 },
    { key: "divider", label: "Insert divider", icon: Minus },
  ],
];

export default function MarkdownEditor({ id, value, onChange, label = "Document text (Markdown)", required = true, maxLength, invalid, describedBy }) {
  const textareaRef = useRef(null);

  const format = (command) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let from = textarea.selectionStart;
    let to = textarea.selectionEnd;
    const selected = value.slice(from, to);
    let replacement = "";
    let selectFrom;
    let selectTo;

    if (command === "bold" || command === "italic") {
      const marker = command === "bold" ? "**" : "*";
      const content = selected || (command === "bold" ? "bold text" : "italic text");
      replacement = `${marker}${content}${marker}`;
      selectFrom = from + marker.length;
      selectTo = selectFrom + content.length;
    } else if (command === "heading1" || command === "heading2") {
      const lastIndex = to > from && value[to - 1] === "\n" ? to - 1 : to;
      from = value.lastIndexOf("\n", from - 1) + 1;
      const lineEnd = value.indexOf("\n", lastIndex);
      to = lineEnd === -1 ? value.length : lineEnd;
      const text = value.slice(from, to).replace(/^#{1,6}[ \t]+/, "") || "Heading";
      const prefix = command === "heading1" ? "# " : "## ";
      replacement = prefix + text;
      selectFrom = from + prefix.length;
      selectTo = selectFrom + text.length;
    } else if (command === "bullet" || command === "numbered") {
      const hadSelection = to > from;
      from = value.lastIndexOf("\n", from - 1) + 1;
      const lastIndex = hadSelection && value[to - 1] === "\n" ? to - 1 : to;
      const lineEnd = value.indexOf("\n", lastIndex);
      to = lineEnd === -1 ? value.length : lineEnd;
      replacement = value.slice(from, to).split("\n").map((line, index) => {
        if (!line && hadSelection) return "";
        const text = line.replace(/^(?:[-*+] |\d+\. )/, "") || "List item";
        return `${command === "bullet" ? "-" : `${index + 1}.`} ${text}`;
      }).join("\n");
      selectFrom = selectTo = from + replacement.length;
    } else if (command === "link") {
      const text = selected || "link text";
      const url = "https://example.com";
      replacement = `[${text}](${url})`;
      selectFrom = from + (selected ? text.length + 3 : 1);
      selectTo = selectFrom + (selected ? url.length : text.length);
    } else if (command === "table") {
      replacement = "\n| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n";
      selectFrom = from + replacement.indexOf("Value 1");
      selectTo = selectFrom + "Value 1".length;
    } else if (command === "divider") {
      replacement = "\n\n---\n\n";
      selectFrom = selectTo = from + replacement.length;
    }

    onChange(value.slice(0, from) + replacement + value.slice(to));
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(selectFrom, selectTo);
    });
  };

  return <div className="min-w-0">
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}{required && <><span aria-hidden="true" className="ml-1 text-rose-700">*</span><span className="sr-only"> required</span></>}</label>
    <div role="group" aria-label="Document formatting" className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-slate-400 bg-slate-50 p-1.5">
      {commands.map((group, index) => <div key={index} role="group" aria-label={["Headings", "Emphasis", "Lists", "Insert"][index]} className="flex items-center gap-1 border-r border-slate-300 pr-1 last:border-r-0 last:pr-0">
        {group.map(({ key, label, icon: Icon }) => <Button key={key} type="button" variant="ghost" size="icon-sm" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => format(key)} className="text-slate-700 hover:bg-white hover:text-slate-950"><Icon size={16} aria-hidden="true"/></Button>)}
      </div>)}
    </div>
    <Textarea ref={textareaRef} id={id} name="body" value={value} onChange={(event) => onChange(event.target.value)} required={required} maxLength={maxLength} aria-invalid={invalid || undefined} aria-describedby={describedBy} rows={22} className="min-h-[38rem] w-full rounded-t-none bg-white font-mono text-sm leading-6"/>
  </div>;
}
