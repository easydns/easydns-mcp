import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { checkDomainAllowed } from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { mailmapsListSchema } from "../schemas.js";

export const definition = {
  name: "mailmaps_list",
  description:
    "List all email forwarding mailmaps for a domain.",
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
  const { domain } = mailmapsListSchema.parse(args);
  checkDomainAllowed(domain, config);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "GET",
    path: `/mail/maps/${encodeURIComponent(domain)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "mailmaps_list",
    domain,
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
