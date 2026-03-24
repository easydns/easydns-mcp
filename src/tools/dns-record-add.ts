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
import { dnsRecordAddSchema } from "../schemas.js";

export const definition = {
  name: "dns_record_add",
  description:
    "Add a new DNS record to a zone. Requires EASYDNS_ENABLE_WRITES=true.",
  inputSchema: {
    type: "object" as const,
    properties: {
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
      rdata: { type: "string", description: "Record data (e.g., IP address)" },
      ttl: { type: "number", description: "TTL in seconds (300-86400, default 600)" },
      prio: { type: "number", description: "Priority (0-100, default 0)" },
      geozone_id: { type: "number", description: "Geo zone ID (0 = no geo)" },
    },
    required: ["domain", "type", "host", "rdata"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = dnsRecordAddSchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  validateRRType(params.type);
  validateTTL(params.ttl);
  denyApexCNAME(params.host, params.type);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "PUT",
    path: `/zones/records/add/${encodeURIComponent(params.domain)}/${encodeURIComponent(params.type)}`,
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
    tool: "dns_record_add",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
    detail: `${params.type} ${params.host} -> ${params.rdata}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Record added successfully: ${params.type} ${params.host}.${params.domain} -> ${params.rdata} (TTL: ${params.ttl})\n\n${JSON.stringify(res.data, null, 2)}`,
      },
    ],
  };
}
