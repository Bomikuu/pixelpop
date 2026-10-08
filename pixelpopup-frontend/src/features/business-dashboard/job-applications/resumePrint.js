import resumeStyles from "./resume.css?inline";

export function printResume({ html, win, title, onMessage, layout = "original" }) {
  if (!html) { if (win && !win.closed) win.close(); onMessage("Open the saved résumé preview before printing."); return; }
  if (!win) { onMessage("Allow pop-ups to open the résumé print dialog."); return; }
  if (win.closed) return;
  win.opener = null;
  const escape = (value) => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  // Content comes only from the sanitized, image-free ReactMarkdown preview.
  const classes = layout === "original" ? "application-resume application-resume--original" : "application-resume";
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>body{margin:0;background:white}${resumeStyles}</style></head><body><article class="${classes}">${html}</article></body></html>`);
  win.document.close();
  win.document.fonts.ready.then(() => { if (!win.closed) { win.focus(); win.print(); } });
}
