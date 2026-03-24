import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { checkDomainAllowed } from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { domainInfoSchema } from "../schemas.js";
import { ApiResponse, DomainInfoData } from "../types.js";

export const definition = {
  name: "domain_info",
  description:
    "Get details about a specific domain (existence, expiry, service level).",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name (e.g., example.com)" },
    },
    required: ["domain"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const { domain } = domainInfoSchema.parse(args);
  checkDomainAllowed(domain, config);
  const cid = createCorrelationId();

  const res = await client.request<ApiResponse<DomainInfoData>>({
    method: "GET",
    path: `/domain/${encodeURIComponent(domain)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "domain_info",
    domain,
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
