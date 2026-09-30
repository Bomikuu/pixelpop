#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_home="${1:-/run/media/ubuntu/55e4927d-6711-41b9-98bb-6a518e415573/home/micxsz}"
destination="${2:-$PWD/codex-antigravity-$(date -u +%Y%m%dT%H%M%SZ).tar.gz}"
exec python3 "$script_dir/migrate-profiles.py" export --source-home "$source_home" --output "$destination"
