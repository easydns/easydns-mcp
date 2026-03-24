#!/usr/bin/env bash
# Delete a DNS record from a domain zone.
# Usage: ./delete-record.sh <domain> <record_id>
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <domain> <record_id>" >&2
  exit 1
fi

DOMAIN="$1"
RECORD_ID="$2"

if [[ "${EASYDNS_ENABLE_WRITES:-false}" != "true" ]]; then
  echo "ERROR: Write operations disabled. Set EASYDNS_ENABLE_WRITES=true" >&2
  exit 1
fi

check_credentials

echo "WARNING: Deleting record ${RECORD_ID} from ${DOMAIN}" >&2
read -r -p "Type DELETE to confirm: " CONFIRM
if [[ "${CONFIRM}" != "DELETE" ]]; then
  echo "Aborted." >&2
  exit 1
fi

api_request DELETE "/zones/records/${DOMAIN}/${RECORD_ID}" | python3 -m json.tool 2>/dev/null || cat
