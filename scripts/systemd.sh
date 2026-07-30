#!/usr/bin/env bash

set -euo pipefail

SERVICE_NAME="futsal-management-system"

usage() {
  cat <<'EOF'
Usage: scripts/systemd.sh <start|stop|restart|status|logs|enable|disable>

Examples:
  scripts/systemd.sh restart
  scripts/systemd.sh logs
  scripts/systemd.sh logs -f
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

action="$1"
shift || true

case "$action" in
  start|stop|restart|status|enable|disable)
    sudo systemctl "$action" "$SERVICE_NAME" "$@"
    ;;
  logs)
    sudo journalctl -u "$SERVICE_NAME" "$@"
    ;;
  *)
    usage
    exit 1
    ;;
esac