# Ubuntu workstation migration kit

Keep these four files together. Run them in a terminal as your normal user. Close ChatGPT/Codex and Antigravity before exporting or importing so their databases are consistent.

## 1. Export the old drive

```bash
./export-profiles.sh \
  /run/media/ubuntu/55e4927d-6711-41b9-98bb-6a518e415573/home/micxsz \
  /path/on/a/drive/with/space/codex-antigravity.tar.gz
```

The first path is the **old user's home directory**, not the `.codex` directory. The second is a new archive path. If omitted, the script uses the old drive path shown above and writes the archive in the current directory. It also writes a matching `.sha256` file. Do not export to the nearly full current system drive.

The archive includes Codex settings, MCP configuration, skills, plugins, sessions, local memory and history databases, and Antigravity extensions, MCP configuration, IDE user settings, conversation data, and knowledge. It omits Codex worktrees, caches, temporary files, and sockets. It does **not** include project folders or SSH keys. Those are separate from these profiles.

**Keep the archive private.** It may contain login tokens, MCP secrets, and private conversations. The exporter sets archive and checksum permissions to owner only (0600). Anyone with a copy of the archive can read its contents; use an encrypted drive or encrypt it before moving it elsewhere.

## 2. Prepare the new Ubuntu installation

```bash
./setup-ubuntu.sh --dry-run
./setup-ubuntu.sh
```

This installs Git, gitk, git-cola, Git LFS, build tools, Python 3 and `venv`, pipx, Node.js and npm, SSH client, Docker Engine and Compose, the ChatGPT desktop app with Codex, Codex CLI, Antigravity, Chrome, and basic command-line utilities. It creates an Ed25519 SSH key only when none exists. The SSH key command asks you to choose a passphrase.

The installer needs at least 2 GiB free space and `sudo` access. It adds your account to the `docker` group so `d up` works after you log out and back in. Membership in that group grants root-equivalent control through Docker. The alias `d='docker compose'` is added to `~/.bash_aliases` for Bash. On ARM64, the script prints Google's Chrome download page for manual package selection.

Use `python3 -m venv .venv` inside any Python project to create its environment. Installing `python3-venv` does not create one globally.

## 3. Import on the destination

Copy the `.tar.gz`, its `.sha256` file, and these scripts to the destination. Quit the apps, then run:

```bash
./import-profiles.sh /path/to/codex-antigravity.tar.gz --dry-run
./import-profiles.sh /path/to/codex-antigravity.tar.gz
```

The importer verifies the SHA-256 file if it is beside the archive. It validates archive paths, asks you to type `IMPORT`, and saves any existing target profiles under `~/profile-import-previous/TIMESTAMP/` before replacing them. It does not touch project folders or SSH keys. You may pass `--target-home /home/another-user` if needed, or `--yes` for unattended import.

Open the apps after the import. You may need to sign in again and reconnect MCP services because tokens stored in the desktop keyring do not move with these files. Old conversations and MCP commands may mention absolute paths from the other drive; copying the profile does not recreate those projects or executables at the same path. Cloud-stored chats and memories are tied to the account rather than this local archive.

## Sources for installer commands

- [OpenAI: ChatGPT desktop app for Linux](https://learn.chatgpt.com/docs/linux/linux-app)
- [OpenAI: Codex CLI](https://learn.chatgpt.com/docs/codex/cli)
- [Google: Antigravity for Linux](https://antigravity.google/download/linux)
- [Docker: install on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Google: install Chrome on Linux](https://support.google.com/chrome/answer/95346)
