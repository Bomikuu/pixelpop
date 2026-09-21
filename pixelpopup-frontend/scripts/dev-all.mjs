import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodeMajor = Number(process.versions.node.split(".")[0]);

if (nodeMajor < 20) {
  console.error("Local frontend + API development requires Node.js 20 or newer.");
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
    shell: options.shell ?? false,
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

const vercelExecutable = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vercel.cmd" : "vercel",
);
const vercelArguments = ["dev", "--listen", "0.0.0.0:5173"];

if (existsSync(vercelExecutable)) {
  run(vercelExecutable, vercelArguments, { shell: process.platform === "win32" });
} else {
  const packageManagerPath = process.env.npm_execpath;
  if (packageManagerPath?.includes("pnpm")) {
    run(process.execPath, [packageManagerPath, "dlx", "vercel@latest", ...vercelArguments]);
  } else {
    const npxExecutable = process.platform === "win32" ? "npx.cmd" : "npx";
    run(npxExecutable, ["--yes", "vercel@latest", ...vercelArguments], {
      shell: process.platform === "win32",
    });
  }
}
