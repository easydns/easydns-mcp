#!/usr/bin/env bash
# Internal shared functions for easyDNS bash scripts.
# NOT intended for direct use. Source this from other scripts.
set -euo pipefail
umask 077

# Validate required env vars
check_credentials() {
  if [[ -z "${EASYDNS_TOKEN:-}" ]]; then
    echo "ERROR: EASYDNS_TOKEN is not set" >&2
    exit 1
  fi
  if [[ -z "${EASYDNS_API_KEY:-}" ]]; then
    echo "ERROR: EASYDNS_API_KEY is not set" >&2
    exit 1
  fi
}

# Get base URL from env
get_base_url() {
  if [[ "${EASYDNS_SANDBOX:-true}" == "true" ]]; then
    echo "https://sandbox.rest.easydns.net"
  else
    if [[ "${EASYDNS_ALLOW_PRODUCTION:-false}" != "true" ]]; then
      echo "ERROR: Production access requires EASYDNS_ALLOW_PRODUCTION=true" >&2
      exit 1
    fi
    echo "https://rest.easydns.net"
  fi
}

# Build auth header value (never exposed in CLI args)
get_auth_header() {
  printf '%s:%s' "${EASYDNS_TOKEN}" "${EASYDNS_API_KEY}" | base64
}

# Safe curl wrapper
api_request() {
  local method="$1"
  local path="$2"
  local data="${3:-}"
  local base_url
  base_url="$(get_base_url)"
  local auth
  auth="$(get_auth_header)"

  local curl_args=(
    -s
    -X "${method}"
    -H "Authorization: Basic ${auth}"
    -H "Accept: application/json"
    --connect-timeout 10
    --max-time 30
    --max-redirs 0
    --proto "=https"
  )

  if [[ -n "${data}" ]]; then
    curl_args+=(-H "Content-Type: application/json" -d "${data}")
  fi

  curl "${curl_args[@]}" "${base_url}${path}?format=json"
}
