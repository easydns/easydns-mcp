#!/usr/bin/env bash
# Production wrapper — use with extreme caution.
# This enables production access with writes.
# Review EASYDNS_PROTECTED_DOMAINS before using.
set -euo pipefail

# Pull credentials from macOS Keychain (never store raw secrets in config files).
# To set up:
#   security add-generic-password -s easydns-token -a easydns -w "your-token"
#   security add-generic-password -s easydns-apikey -a easydns -w "your-api-key"
#
# For 1Password CLI, replace with:
#   export EASYDNS_TOKEN=$(op read "op://vault/easydns/token")
#   export EASYDNS_API_KEY=$(op read "op://vault/easydns/apikey")
export EASYDNS_TOKEN=$(security find-generic-password -s easydns-token -w)
export EASYDNS_API_KEY=$(security find-generic-password -s easydns-apikey -w)

export EASYDNS_SANDBOX=false
export EASYDNS_ALLOW_PRODUCTION=true
export EASYDNS_ENABLE_WRITES=true

# SAFETY: Protect critical domains from modification
export EASYDNS_PROTECTED_DOMAINS="example.com,important.org"

exec node "$(dirname "$0")/../dist/index.js"
