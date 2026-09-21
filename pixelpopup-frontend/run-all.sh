#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NVM_DIRECTORY="${NVM_DIR:-$HOME/.nvm}"

if [[ -s "$NVM_DIRECTORY/nvm.sh" ]]; then
  # nvm is a shell function, so non-interactive scripts must load it explicitly.
  # shellcheck source=/dev/null
  source "$NVM_DIRECTORY/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1; then
  nvm use 20
elif ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -lt 20 ]]; then
  echo "Node.js 20+ is required. Install/load nvm, then run: nvm use 20" >&2
  exit 1
fi

cd "$PROJECT_DIR"
npm run dev:all
