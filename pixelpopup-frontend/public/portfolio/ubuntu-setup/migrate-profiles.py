#!/usr/bin/env python3
"""Portable Codex and Antigravity profile backup (Python standard library only)."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import sys
import tarfile
import tempfile

ROOTS = (
    ".codex",
    ".antigravity-ide",
    ".gemini/config",
    ".gemini/antigravity-ide",
    ".config/Antigravity IDE/User",
)
SKIP_DIRS = {
    ".codex": {"worktrees", "cache", ".tmp", "tmp", "ipc", "node_repl", "thread-writer-locks", "shell_snapshots"},
    ".gemini/antigravity-ide": {"crashes"},
}
SKIP_FILES = {".codex": {"installation_id", "models_cache.json"}}
MARKER = "profile-backup.json"


def source_root(value):
    home = Path(value).expanduser().resolve()
    if not home.is_dir():
        raise ValueError(f"Source home does not exist: {home}")
    return home


def add_tree(archive, home, rel, skipped):
    base = home / rel
    if not base.is_dir() or base.is_symlink():
        skipped.append(f"Missing: {rel}")
        return False
    for current, dirs, files in os.walk(base, followlinks=False):
        path = Path(current)
        depth = len(path.relative_to(base).parts)
        dirs[:] = sorted(d for d in dirs if not (depth == 0 and d in SKIP_DIRS.get(rel, set())))
        archive.add(path, arcname=f"profiles/{path.relative_to(home)}", recursive=False)
        for name in sorted(files):
            item = path / name
            if depth == 0 and name in SKIP_FILES.get(rel, set()):
                continue
            if item.is_symlink() or not item.is_file():
                skipped.append(f"Skipped special file: {item.relative_to(home)}")
                continue
            archive.add(item, arcname=f"profiles/{item.relative_to(home)}", recursive=False)
        dirs[:] = [d for d in dirs if not (path / d).is_symlink()]
    return True


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def export(args):
    home = source_root(args.source_home)
    output = Path(args.output).expanduser().resolve()
    if output.exists():
        raise ValueError(f"Output already exists: {output}")
    if any(output.is_relative_to(home / rel) for rel in ROOTS):
        raise ValueError("Output must be outside the profiles being backed up")
    output.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(output.parent, 0o700) if args.private_directory else None
    skipped, found = [], []
    old_umask = os.umask(0o077)
    try:
        with output.open("xb") as raw:
            with tarfile.open(fileobj=raw, mode="w:gz", format=tarfile.PAX_FORMAT) as archive:
                for rel in ROOTS:
                    if add_tree(archive, home, rel, skipped):
                        found.append(rel)
                if ".codex" not in found:
                    raise ValueError("No .codex profile found in source home")
                import io
                payload = json.dumps({"format": 1, "created_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
                                      "roots": found, "notes": skipped}, indent=2).encode()
                info = tarfile.TarInfo(MARKER)
                info.size, info.mode = len(payload), 0o600
                archive.addfile(info, io.BytesIO(payload))
        output.chmod(0o600)
        checksum = output.with_name(output.name + ".sha256")
        checksum.write_text(f"{digest(output)}  {output.name}\n")
        checksum.chmod(0o600)
    except BaseException:
        output.unlink(missing_ok=True)
        raise
    finally:
        os.umask(old_umask)
    print(f"Backup: {output}\nSHA-256: {checksum}\nIncluded: {', '.join(found)}")
    for note in skipped:
        print(note)


def safe_member(member):
    name = member.name
    parts = Path(name).parts
    if member.issym() or member.islnk() or not (member.isdir() or member.isfile()):
        raise ValueError(f"Unsupported archive entry: {name}")
    if name == MARKER:
        return
    if not name.startswith("profiles/") or Path(name).is_absolute() or ".." in parts:
        raise ValueError(f"Unsafe archive path: {name}")
    rel = Path(*parts[1:])
    if not any(rel == Path(root) or rel.is_relative_to(Path(root)) for root in ROOTS):
        raise ValueError(f"Unexpected archive path: {name}")


def import_(args):
    archive_path = Path(args.archive).expanduser().resolve()
    home = Path(args.target_home).expanduser().resolve()
    if not home.is_dir():
        raise ValueError(f"Target home does not exist: {home}")
    checksum = archive_path.with_name(archive_path.name + ".sha256")
    if checksum.exists():
        expected = checksum.read_text().split()[0]
        if digest(archive_path) != expected:
            raise ValueError("SHA-256 check failed; archive may be damaged")
        print("SHA-256 verified")
    with tarfile.open(archive_path, "r:gz") as archive:
        members = archive.getmembers()
        names = [member.name for member in members]
        if len(names) != len(set(names)):
            raise ValueError("Duplicate archive paths")
        for member in members:
            safe_member(member)
        markers = [m for m in members if m.name == MARKER]
        if len(markers) != 1:
            raise ValueError("Missing or duplicate backup manifest")
        metadata = json.load(archive.extractfile(markers[0]))
        if metadata.get("format") != 1 or not isinstance(metadata.get("roots"), list):
            raise ValueError("Unsupported backup format")
        roots = metadata["roots"]
        if not roots or any(root not in ROOTS for root in roots):
            raise ValueError("Invalid roots in backup manifest")
        print(f"Backup from {metadata['created_utc']} includes: {', '.join(roots)}")
        if args.dry_run:
            print("Dry run: no files changed")
            return
        if not args.yes:
            answer = input(f"Replace these profiles under {home}? Existing ones will be saved. Type IMPORT: ")
            if answer != "IMPORT":
                print("Cancelled")
                return
        # Stage under the target home so renames stay on the same filesystem.
        with tempfile.TemporaryDirectory(prefix=".profile-import-", dir=home) as temp:
            stage = Path(temp)
            for member in members:
                if member.name == MARKER:
                    continue
                target = stage / member.name
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                    target.chmod(0o700)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.extractfile(member) as source, target.open("xb") as sink:
                        shutil.copyfileobj(source, sink)
                    target.chmod(member.mode & 0o700 or 0o600)
            stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            saved = home / "profile-import-previous" / stamp
            for root in roots:
                old = home / root
                new = stage / "profiles" / root
                if not new.is_dir():
                    raise ValueError(f"Archive incomplete: {root}")
                if old.exists() or old.is_symlink():
                    prior = saved / root
                    prior.parent.mkdir(parents=True, exist_ok=True)
                    old.rename(prior)
                old.parent.mkdir(parents=True, exist_ok=True)
                new.rename(old)
            if saved.exists():
                print(f"Previous profiles saved at: {saved}")
    print("Import complete. Restart both applications and sign in again if asked.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    ex = sub.add_parser("export")
    ex.add_argument("--source-home", required=True, help="Old user's home directory")
    ex.add_argument("--output", required=True, help="New .tar.gz archive path")
    ex.add_argument("--private-directory", action="store_true", help="chmod output directory to 700")
    im = sub.add_parser("import")
    im.add_argument("archive", help="Archive produced by export")
    im.add_argument("--target-home", default=str(Path.home()))
    im.add_argument("--dry-run", action="store_true")
    im.add_argument("--yes", action="store_true", help="Skip interactive confirmation")
    args = parser.parse_args()
    try:
        (export if args.command == "export" else import_)(args)
    except (OSError, ValueError, tarfile.TarError, EOFError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
