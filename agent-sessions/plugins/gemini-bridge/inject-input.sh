#!/usr/bin/env bash
set -euo pipefail

PID="$1"
TEXT="$2"

if [ -n "${TMUX:-}" ] && command -v tmux >/dev/null 2>&1; then
  tmux send-keys -t "$TMUX_PANE" -- "$TEXT" Enter
  exit 0
fi

printf '%s\n' "$TEXT" > "/proc/$PID/fd/0" 2>/dev/null || {
  echo "Phone input needs tmux or a focused Gemini terminal on this platform." >&2
  exit 1
}
