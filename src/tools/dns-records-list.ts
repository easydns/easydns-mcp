import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { checkDomainAllowed } from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { dnsRecordsListSchema } from "../schemas.js";

export const definition = {
  name: "dns_records_list",
  description:
    "List all DNS zone records for a domain (raw format with record IDs).",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
    },
    required: ["domain"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const { domain } = dnsRecordsListSchema.parse(args);
  checkDomainAllowed(domain, config);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "GET",
    path: `/zones/records/all/${encodeURIComponent(domain)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "dns_records_list",
    domain,
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
