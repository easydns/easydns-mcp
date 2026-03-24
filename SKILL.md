# easyDNS Management

Manage DNS records, domains, mailmaps, and nameservers via the easyDNS REST API.

## Prerequisites

Set these environment variables:
```
EASYDNS_TOKEN=<your-api-token>
EASYDNS_API_KEY=<your-api-key>
EASYDNS_SANDBOX=true
```

For write operations, also set `EASYDNS_ENABLE_WRITES=true`.

## Common Tasks

### List all domains for a user
```bash
curl -s -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/domains/list/USERNAME?format=json" | python3 -m json.tool
```

### Get domain info
```bash
curl -s -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/domain/example.com?format=json" | python3 -m json.tool
```

### List DNS records
```bash
curl -s -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/zones/records/all/example.com?format=json" | python3 -m json.tool
```

### List parsed DNS records (zonefile format)
```bash
curl -s -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/zones/records/parsed/example.com?format=json" | python3 -m json.tool
```

### Add a DNS record
```bash
curl -s -X PUT \
  -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  -H "Content-Type: application/json" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  -d '{"domain":"example.com","host":"www","rdata":"1.2.3.4","ttl":600,"type":"A"}' \
  "https://sandbox.rest.easydns.net/zones/records/add/example.com/A?format=json" | python3 -m json.tool
```

### Delete a DNS record
```bash
curl -s -X DELETE \
  -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/zones/records/example.com/RECORD_ID?format=json" | python3 -m json.tool
```

### Get nameservers
```bash
curl -s -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/domains/ns/example.com?format=json" | python3 -m json.tool
```

### Check domain availability and pricing
```bash
curl -s -X POST \
  -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  -H "Content-Type: application/json" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  -d '{"service":"dns","min_term":1,"max_term":1}' \
  "https://sandbox.rest.easydns.net/domains/service/check/example.com?format=json" | python3 -m json.tool
```

### List mailmaps
```bash
curl -s -H "Authorization: Basic $(printf '%s:%s' "$EASYDNS_TOKEN" "$EASYDNS_API_KEY" | base64)" \
  --connect-timeout 10 --max-time 30 --max-redirs 0 --proto "=https" \
  "https://sandbox.rest.easydns.net/mail/maps/example.com?format=json" | python3 -m json.tool
```

## Bash Scripts

Hardened bash scripts are in `scripts/`:
- `list-records.sh <domain>` — list zone records
- `add-record.sh <domain> <type> <host> <rdata> [ttl]` — add a record
- `delete-record.sh <domain> <record_id>` — delete a record (interactive confirm)
- `domain-info.sh <domain>` — get domain info

## Security Rules

- All scripts use `set -euo pipefail` and `umask 077`
- HTTPS only, no redirects, 30s timeout
- Auth via header, never CLI args
- No `eval`, no `set -x`
- Write operations gated behind `EASYDNS_ENABLE_WRITES=true`
- Sandbox by default (`EASYDNS_SANDBOX=true`)

## Valid Record Types

A, AAAA, AFSDB, ANAME, CAA, CERT, CNAME, DYN, MX, NAPTR, NS, PTR, SECONDARY, SOA, SPF, SRV, SSHFP, STEALTH, TLSA, TXT, URL, URLHTTPS

## API Endpoints Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | /domains/list/{user} | List user domains |
| GET | /domain/{domain} | Domain info |
| GET | /zones/records/all/{domain} | List zone records |
| GET | /zones/records/parsed/{domain} | Parsed zone records |
| GET | /zones/records/all/{domain}/search/{keyword} | Search records |
| GET | /zones/records/soa/{domain} | SOA serial |
| GET | /domains/ns/{domain} | Get nameservers |
| GET | /mail/maps/{domain} | List mailmaps |
| GET | /domains/regstatus | Registration status |
| POST | /domains/service/check/{domain} | Check availability |
| PUT | /zones/records/add/{domain}/{type} | Add record |
| POST | /zones/records/{id} | Modify record |
| DELETE | /zones/records/{domain}/{id} | Delete record |
| GET | /zones/reload/{domain}/force | Force zone reload |
| POST | /domains/ns/{domain} | Update nameservers |
| PUT | /mail/maps/{domain} | Create mailmap |
| DELETE | /mail/maps/{domain}/{id} | Delete mailmap |
