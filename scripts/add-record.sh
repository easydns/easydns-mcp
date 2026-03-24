#!/usr/bin/env bash
# Add a DNS record to a domain zone.
# Usage: ./add-record.sh <domain> <type> <host> <rdata> [ttl]
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <domain> <type> <host> <rdata> [ttl]" >&2
  echo "Example: $0 example.com A www 1.2.3.4 600" >&2
  exit 1
fi

DOMAIN="$1"
TYPE="$2"
HOST="$3"
RDATA="$4"
TTL="${5:-600}"

if [[ "${EASYDNS_ENABLE_WRITES:-false}" != "true" ]]; then
  echo "ERROR: Write operations disabled. Set EASYDNS_ENABLE_WRITES=true" >&2
  exit 1
fi

check_credentials

DATA=$(printf '{"domain":"%s","host":"%s","rdata":"%s","ttl":%s,"type":"%s"}' \
  "${DOMAIN}" "${HOST}" "${RDATA}" "${TTL}" "${TYPE}")

api_request PUT "/zones/records/add/${DOMAIN}/${TYPE}" "${DATA}" | python3 -m json.tool 2>/dev/null || cat
