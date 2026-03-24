#!/usr/bin/env bash
# List all DNS records for a domain.
# Usage: ./list-records.sh <domain>
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <domain>" >&2
  exit 1
fi

DOMAIN="$1"
check_credentials
api_request GET "/zones/records/all/${DOMAIN}" | python3 -m json.tool 2>/dev/null || cat
