import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { checkDomainAllowed } from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { zoneSOASchema } from "../schemas.js";

export const definition = {
  name: "zone_soa",
  description: "Get the current SOA (Start of Authority) serial for a zone.",
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
  const { domain } = zoneSOASchema.parse(args);
  checkDomainAllowed(domain, config);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "GET",
    path: `/zones/records/soa/${encodeURIComponent(domain)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "zone_soa",
    domain,
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
