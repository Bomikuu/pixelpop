import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export default function workspacePwaPlugin() {
  return {
    name: "workspace-pwa",
    apply: "build",
    async generateBundle(_options, bundle) {
      const template = await readFile(new URL("../src/features/workspace-pwa/workspace-sw.template.js", import.meta.url), "utf8");
      const hash = createHash("sha256").update(template);
      for (const key of Object.keys(bundle).sort()) {
        const item = bundle[key];
        hash.update(key).update(item.type === "chunk" ? item.code : item.source);
      }
      for (const file of ["workspace.webmanifest", "workspace-offline.html", "workspace-icons/icon-192.png", "workspace-icons/icon-512.png", "workspace-icons/maskable-512.png", "workspace-icons/apple-touch-icon-180.png"]) {
        hash.update(await readFile(new URL(`../public/${file}`, import.meta.url)));
      }
      this.emitFile({ type: "asset", fileName: "workspace-sw.js", source: template.replaceAll("__WORKSPACE_BUILD_ID__", hash.digest("hex").slice(0, 20)) });
    },
  };
}
