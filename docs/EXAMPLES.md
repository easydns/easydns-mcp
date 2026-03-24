# Examples

## Typical agent conversations

### "List my domains"
Agent calls `domain_list` with your username. Returns all domains on your account.

### "Show me the DNS records for example.com"
Agent calls `dns_records_parsed` for a human-friendly view, or `dns_records_list` for raw records with IDs.

### "Add an A record for www.example.com pointing to 1.2.3.4"
Agent calls `dns_record_add` with:
```json
{
  "domain": "example.com",
  "type": "A",
  "host": "www",
  "rdata": "1.2.3.4",
  "ttl": 600
}
```

### "Delete record 12345 from example.com"
Agent calls `dns_record_delete` with:
```json
{
  "domain": "example.com",
  "id": "12345",
  "confirm": "DELETE"
}
```

### "What nameservers does example.com use?"
Agent calls `nameservers_get`.

### "Is coolnewdomain.com available?"
Agent calls `domain_check` with the domain name.

### "Set up email forwarding from info@example.com to me@gmail.com"
Agent calls `mailmaps_create` with:
```json
{
  "domain": "example.com",
  "alias": "info",
  "destination": "me@gmail.com",
  "active": 1
}
```

## Phased rollout

### Phase A: Sandbox read-only (safe for testing)
```
EASYDNS_SANDBOX=true
EASYDNS_ENABLE_WRITES=false
```
All read tools work. Write tools return policy errors.

### Phase B: Sandbox writes (test modifications)
```
EASYDNS_SANDBOX=true
EASYDNS_ENABLE_WRITES=true
```
All tools work against sandbox. Destructive ops need confirmation strings.

### Phase C: Production read-only
```
EASYDNS_SANDBOX=false
EASYDNS_ALLOW_PRODUCTION=true
EASYDNS_ENABLE_WRITES=false
EASYDNS_PROTECTED_DOMAINS=critical.com
```

### Phase D: Production writes
```
EASYDNS_SANDBOX=false
EASYDNS_ALLOW_PRODUCTION=true
EASYDNS_ENABLE_WRITES=true
EASYDNS_PROTECTED_DOMAINS=critical.com,donttouch.org
```
