import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  validateRRType,
  validateTTL,
  denyApexCNAME,
} from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { dnsRecordModifySchema } from "../schemas.js";

export const definition = {
  name: "dns_record_modify",
  description:
    "Modify an existing DNS zone record by ID. Requires EASYDNS_ENABLE_WRITES=true.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number", description: "Zone record ID to modify" },
      domain: { type: "string", description: "Domain name" },
      type: {
        type: "string",
        enum: [
          "A", "AAAA", "AFSDB", "ANAME", "CAA", "CERT", "CNAME", "DYN",
          "MX", "NAPTR", "NS", "PTR", "SECONDARY", "SOA", "SPF", "SRV",
          "SSHFP", "STEALTH", "TLSA", "TXT", "URL", "URLHTTPS",
        ],
        description: "DNS record type",
      },
      host: { type: "string", description: "Hostname (use @ for zone apex)" },
      rdata: { type: "string", description: "Record data" },
      ttl: { type: "number", description: "TTL in seconds (300-86400)" },
      prio: { type: "number", description: "Priority (0-100)" },
      geozone_id: { type: "number", description: "Geo zone ID (0 = no geo)" },
    },
    required: ["id", "domain", "type", "host", "rdata"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = dnsRecordModifySchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  validateRRType(params.type);
  validateTTL(params.ttl);
  denyApexCNAME(params.host, params.type);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "POST",
    path: `/zones/records/${encodeURIComponent(String(params.id))}`,
    body: {
      domain: params.domain,
      host: params.host,
      rdata: params.rdata,
      ttl: params.ttl,
      prio: params.prio,
      type: params.type,
      geozone_id: params.geozone_id,
    },
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "dns_record_modify",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
    detail: `id=${params.id} ${params.type} ${params.host}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
