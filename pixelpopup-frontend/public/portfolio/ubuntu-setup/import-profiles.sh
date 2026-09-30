#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 BACKUP.tar.gz [--target-home DIR] [--dry-run] [--yes]" >&2
  exit 2
fi
exec python3 "$script_dir/migrate-profiles.py" import "$@"
