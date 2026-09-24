#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
backend_dir="$project_root/backendv2"
frontend_dir="$project_root/pixelpopup-frontend"
venv_python="$backend_dir/.venv/bin/python"

if ! command -v node >/dev/null 2>&1 && [[ -f "$HOME/.nvm/nvm.sh" ]]; then
  # NVM is often initialized only for interactive shells.
  source "$HOME/.nvm/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required to run the frontend." >&2
  exit 1
fi

if [[ ! -x "$venv_python" ]]; then
  if command -v python3.12 >/dev/null 2>&1; then
    python_command=python3.12
  else
    python_command=python3
  fi
  echo "Creating backend virtual environment..."
  if ! "$python_command" -m venv "$backend_dir/.venv"; then
    "$python_command" -m venv --without-pip "$backend_dir/.venv"
  fi
fi

if ! "$venv_python" -m pip --version >/dev/null 2>&1; then
  echo "Bootstrapping pip in the virtual environment..."
  pip_installer="$(mktemp)"
  curl -fsSL https://bootstrap.pypa.io/get-pip.py -o "$pip_installer"
  "$venv_python" "$pip_installer"
  rm -f "$pip_installer"
fi

if [[ ! -f "$backend_dir/.venv/bin/activate" ]]; then
  cat > "$backend_dir/.venv/bin/activate" <<'ACTIVATE'
deactivate() {
  if [[ -n "${_OLD_VIRTUAL_PATH:-}" ]]; then
    PATH="$_OLD_VIRTUAL_PATH"
    export PATH
    unset _OLD_VIRTUAL_PATH
  fi
  if [[ -n "${_OLD_VIRTUAL_PS1:-}" ]]; then
    PS1="$_OLD_VIRTUAL_PS1"
    export PS1
    unset _OLD_VIRTUAL_PS1
  fi
  unset VIRTUAL_ENV
  unset -f deactivate
  hash -r 2>/dev/null || true
}

deactivate 2>/dev/null || true
_OLD_VIRTUAL_PATH="$PATH"
VIRTUAL_ENV="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export VIRTUAL_ENV
PATH="$VIRTUAL_ENV/bin:$PATH"
export PATH
if [[ -z "${VIRTUAL_ENV_DISABLE_PROMPT:-}" ]]; then
  _OLD_VIRTUAL_PS1="${PS1:-}"
  PS1="(.venv) ${PS1:-}"
  export PS1
fi
hash -r 2>/dev/null || true
ACTIVATE
fi

if ! "$venv_python" -c "import django, dotenv" >/dev/null 2>&1; then
  echo "Installing backend dependencies..."
  "$venv_python" -m pip install -r "$backend_dir/requirements.txt"
fi

if [[ ! -f "$frontend_dir/node_modules/vite/bin/vite.js" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$frontend_dir" && npm ci)
fi

echo "Applying backend migrations..."
(cd "$backend_dir" && "$venv_python" manage.py migrate --noinput)

backend_pid=""
frontend_pid=""
cleanup() {
  trap - EXIT INT TERM
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Backend: http://localhost:8000"
(cd "$backend_dir" && exec "$venv_python" manage.py runserver 0.0.0.0:8000 --noreload) &
backend_pid=$!

echo "Frontend: http://localhost:5173"
(cd "$frontend_dir" && exec node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173) &
frontend_pid=$!

wait -n "$backend_pid" "$frontend_pid"
