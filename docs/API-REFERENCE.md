# API Reference

## Tools

### Phase A — Read-Only

#### `domain_list`
List all domains for a user.
- **Input**: `user` (string, required)
- **Endpoint**: GET /domains/list/{user}

#### `domain_info`
Get domain details (existence, expiry, service level).
- **Input**: `domain` (string, required)
- **Endpoint**: GET /domain/{domain}

#### `dns_records_list`
List all zone records with IDs.
- **Input**: `domain` (string, required)
- **Endpoint**: GET /zones/records/all/{domain}

#### `dns_records_parsed`
List zone records in human-readable zonefile format.
- **Input**: `domain` (string, required)
- **Endpoint**: GET /zones/records/parsed/{domain}

#### `dns_records_search`
Search zone records by keyword.
- **Input**: `domain` (string), `keyword` (string)
- **Endpoint**: GET /zones/records/all/{domain}/search/{keyword}

#### `zone_soa`
Get SOA serial number.
- **Input**: `domain` (string, required)
- **Endpoint**: GET /zones/records/soa/{domain}

#### `nameservers_get`
Get assigned nameservers.
- **Input**: `domain` (string, required)
- **Endpoint**: GET /domains/ns/{domain}

#### `mailmaps_list`
List email forwarding rules.
- **Input**: `domain` (string, required)
- **Endpoint**: GET /mail/maps/{domain}

#### `registration_status`
Get reglock and renewal status for all user domains.
- **Input**: none
- **Endpoint**: GET /domains/regstatus

#### `domain_check`
Check domain availability and pricing.
- **Input**: `domain` (string, required), `service` (optional), `min_term` (optional), `max_term` (optional)
- **Endpoint**: POST /domains/service/check/{domain}

### Phase B — Write (requires `EASYDNS_ENABLE_WRITES=true`)

#### `dns_record_add`
Add a DNS record.
- **Input**: `domain`, `type`, `host`, `rdata`, `ttl` (default 600), `prio` (default 0), `geozone_id` (default 0)
- **Endpoint**: PUT /zones/records/add/{domain}/{type}

#### `dns_record_modify`
Modify an existing record by ID.
- **Input**: `id` (number), `domain`, `type`, `host`, `rdata`, `ttl`, `prio`, `geozone_id`
- **Endpoint**: POST /zones/records/{id}

#### `dns_record_delete`
Delete a record. **Requires `confirm: "DELETE"`.**
- **Input**: `domain`, `id` (string), `confirm`
- **Endpoint**: DELETE /zones/records/{domain}/{id}

#### `zone_reload`
Force zone regeneration. **Requires `confirm: "RELOAD"`.**
- **Input**: `domain`, `confirm`
- **Endpoint**: GET /zones/reload/{domain}/force

#### `nameservers_update`
Update nameservers. **Requires `confirm: "UPDATE_NS"`.**
- **Input**: `domain`, `nameservers` (array, 2-10), `confirm`
- **Endpoint**: POST /domains/ns/{domain}

#### `mailmaps_create`
Create email forwarding rule.
- **Input**: `domain`, `alias`, `host` (default "@"), `destination`, `active` (default 1)
- **Endpoint**: PUT /mail/maps/{domain}

#### `mailmaps_delete`
Delete email forwarding rule. **Requires `confirm: "DELETE"`.**
- **Input**: `domain`, `mailmap_id`, `confirm`
- **Endpoint**: DELETE /mail/maps/{domain}/{mailmap_id}

## Resources

#### `easydns://geo-regions`
List of geo region IDs for geo-aware records.

#### `easydns://service/{service_id}`
Service level description by ID.

#### `easydns://subscription/{subscription_id}`
Subscription block description by ID.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EASYDNS_TOKEN` | (required) | API token |
| `EASYDNS_API_KEY` | (required) | API key |
| `EASYDNS_DOMAIN` | — | Default domain |
| `EASYDNS_SANDBOX` | `true` | Use sandbox API |
| `EASYDNS_ENABLE_WRITES` | `false` | Allow write operations |
| `EASYDNS_ALLOW_PRODUCTION` | `false` | Allow production API |
| `EASYDNS_ALLOW_DOMAIN_DELETE` | `false` | Allow domain deletion |
| `EASYDNS_ALLOW_USER_MUTATIONS` | `false` | Allow user account changes |
| `EASYDNS_ALLOWED_DOMAINS` | — | Comma-separated allowlist |
| `EASYDNS_PROTECTED_DOMAINS` | — | Comma-separated denylist |
