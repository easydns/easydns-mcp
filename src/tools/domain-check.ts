import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { audit, createCorrelationId } from "../logger.js";
import { domainCheckSchema } from "../schemas.js";

export const definition = {
  name: "domain_check",
  description:
    "Check domain availability and get pricing information (including user discounts).",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain to check (e.g., example.com)" },
      service: {
        type: "string",
        enum: ["lite", "dns", "pro", "enterprise"],
        description: "Service level to check pricing for",
      },
      min_term: { type: "number", description: "Minimum term in years" },
      max_term: { type: "number", description: "Maximum term in years" },
    },
    required: ["domain"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const { domain, service, min_term, max_term } = domainCheckSchema.parse(args);
  const cid = createCorrelationId();

  const body: Record<string, unknown> = {};
  if (service) body.service = service;
  if (min_term) body.min_term = min_term;
  if (max_term) body.max_term = max_term;

  const res = await client.request({
    method: "POST",
    path: `/domains/service/check/${encodeURIComponent(domain)}`,
    body: Object.keys(body).length > 0 ? body : undefined,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "domain_check",
    domain,
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
