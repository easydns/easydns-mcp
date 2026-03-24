import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { checkDomainAllowed } from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { dnsRecordsSearchSchema } from "../schemas.js";

export const definition = {
  name: "dns_records_search",
  description:
    "Search DNS zone records matching a keyword.",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
      keyword: { type: "string", description: "Search keyword" },
    },
    required: ["domain", "keyword"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const { domain, keyword } = dnsRecordsSearchSchema.parse(args);
  checkDomainAllowed(domain, config);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "GET",
    path: `/zones/records/all/${encodeURIComponent(domain)}/search/${encodeURIComponent(keyword)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "dns_records_search",
    domain,
    outcome: res.ok ? "success" : "error",
    detail: `keyword="${keyword}"`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
