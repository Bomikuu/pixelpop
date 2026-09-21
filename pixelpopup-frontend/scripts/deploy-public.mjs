import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodeMajor = Number(process.versions.node.split(".")[0]);

if (nodeMajor < 20) {
  console.error("Public deployment requires Node.js 20 or newer.");
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

const packageManagerPath = process.env.npm_execpath;
if (packageManagerPath) run(process.execPath, [packageManagerPath, "run", "build"]);
else run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { shell: process.platform === "win32" });

if (!existsSync(resolve(projectRoot, "dist", "index.html"))) {
  console.error("Build finished without dist/index.html; deployment stopped.");
  process.exit(1);
}

const localVercel = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vercel.cmd" : "vercel",
);

if (existsSync(localVercel)) {
  run(localVercel, ["deploy", "--prod", "--yes"], { shell: process.platform === "win32" });
} else {
  if (packageManagerPath?.includes("pnpm")) {
    run(process.execPath, [packageManagerPath, "dlx", "vercel@latest", "deploy", "--prod", "--yes"]);
  } else {
    const npxExecutable = process.platform === "win32" ? "npx.cmd" : "npx";
    run(npxExecutable, ["--yes", "vercel@latest", "deploy", "--prod", "--yes"], { shell: process.platform === "win32" });
  }
}
