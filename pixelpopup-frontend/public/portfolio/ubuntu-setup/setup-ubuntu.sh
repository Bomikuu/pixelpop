#!/usr/bin/env bash
# Developer workstation setup for Ubuntu 24.04/26.04, x64/ARM64.
set -euo pipefail

if [[ "${1:-}" == "--dry-run" ]]; then
  cat <<'PLAN'
Will install: Ubuntu development tools (Git, gitk, git-cola, curl, Python venv,
Node.js/npm, ripgrep, jq, rsync, build tools), Docker Engine + Compose,
ChatGPT desktop with Codex, Codex CLI, Antigravity, and Google Chrome.
Will add the current user to the docker group, add alias d='docker compose',
and offer to create an Ed25519 SSH key if none exists.
PLAN
  exit 0
fi

if [[ $EUID -eq 0 ]]; then
  echo "Run as your normal user, not root; this script calls sudo when needed." >&2
  exit 1
fi
. /etc/os-release
if [[ "$ID" != ubuntu ]]; then
  echo "This script supports Ubuntu only (found $ID)." >&2
  exit 1
fi
arch="$(dpkg --print-architecture)"
if [[ "$arch" != amd64 && "$arch" != arm64 ]]; then
  echo "Unsupported architecture: $arch" >&2
  exit 1
fi
free_kb="$(df -Pk "$HOME" | awk 'NR==2 {print $4}')"
if (( free_kb < 2097152 )); then
  echo "At least 2 GiB free space is needed in $HOME; currently $((free_kb/1024)) MiB." >&2
  exit 1
fi

sudo -v
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates curl gnupg git gitk git-cola git-lfs \
  build-essential make pkg-config python3 python3-pip python3-venv pipx \
  nodejs npm openssh-client rsync ripgrep jq unzip zip tar tree htop \
  wget xz-utils software-properties-common

if ! command -v docker >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2
elif ! docker compose version >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-v2
fi
sudo systemctl enable --now docker
if ! id -nG "$USER" | tr ' ' '\n' | grep -qx docker; then
  sudo usermod -aG docker "$USER"
  echo "Docker group added. Log out and back in before using docker without sudo."
fi
touch "$HOME/.bash_aliases"
if ! grep -Fxq "alias d='docker compose'" "$HOME/.bash_aliases"; then
  printf "\nalias d='docker compose'\n" >> "$HOME/.bash_aliases"
fi
echo "Alias added: d up (available in a new Bash terminal)."

temp_dir="$(mktemp -d)"
trap 'rm -rf -- "$temp_dir"' EXIT
if ! dpkg-query -W -f='${Status}' chatgpt 2>/dev/null | grep -q 'install ok installed'; then
  echo "Installing the official ChatGPT desktop app (includes Codex)."
  curl --proto '=https' --tlsv1.2 -fL \
    "https://persistent.oaistatic.com/codex-app-prod/linux/deb/latest/chatgpt_${arch}.deb" \
    -o "$temp_dir/chatgpt.deb"
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "$temp_dir/chatgpt.deb"
fi
if ! npm list -g --depth=0 @openai/codex >/dev/null 2>&1; then
  sudo npm install -g @openai/codex@latest
fi

if ! command -v antigravity >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl --proto '=https' --tlsv1.2 -fsSL \
    https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg \
    -o "$temp_dir/antigravity-key.gpg"
  gpg --batch --dearmor -o "$temp_dir/antigravity-keyring.gpg" "$temp_dir/antigravity-key.gpg"
  sudo install -m 0644 "$temp_dir/antigravity-keyring.gpg" /etc/apt/keyrings/antigravity-repo-key.gpg
  printf '%s\n' 'deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main' \
    | sudo tee /etc/apt/sources.list.d/antigravity.list >/dev/null
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y antigravity
fi

if ! command -v google-chrome >/dev/null 2>&1; then
  if [[ "$arch" == amd64 ]]; then
    curl --proto '=https' --tlsv1.2 -fL \
      https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
      -o "$temp_dir/chrome.deb"
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "$temp_dir/chrome.deb"
  else
    echo "Chrome ARM64: download the Ubuntu ARM64 .deb from https://www.google.com/chrome/"
  fi
fi

if ! compgen -G "$HOME/.ssh/id_*.pub" >/dev/null; then
  mkdir -p "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  echo "Creating an SSH key. Choose a passphrase at the prompt."
  ssh-keygen -t ed25519 -a 100 -C "$USER@$(hostname)" -f "$HOME/.ssh/id_ed25519"
fi

echo "Done. Restart your terminal. Verify: docker compose version; node -v; npm -v; python3 -m venv --help; codex --version"
