import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { checkDomainAllowed, checkWriteEnabled } from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { mailmapsCreateSchema } from "../schemas.js";

export const definition = {
  name: "mailmaps_create",
  description:
    "Create a new email forwarding mailmap. Requires EASYDNS_ENABLE_WRITES=true.",
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
      alias: { type: "string", description: 'Alias portion (e.g., "info")' },
      host: { type: "string", description: 'Host (use "@" for domain root)' },
      destination: { type: "string", description: "Destination email to forward to" },
      active: { type: "number", description: "Whether active (0 or 1, default 1)" },
    },
    required: ["domain", "alias", "destination"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = mailmapsCreateSchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  const cid = createCorrelationId();

  const res = await client.request({
    method: "PUT",
    path: `/mail/maps/${encodeURIComponent(params.domain)}`,
    body: {
      alias: params.alias,
      host: params.host,
      destination: params.destination,
      active: params.active,
    },
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "mailmaps_create",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
    detail: `${params.alias}@${params.domain} -> ${params.destination}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Mailmap created: ${params.alias}@${params.domain} -> ${params.destination}\n\n${JSON.stringify(res.data, null, 2)}`,
      },
    ],
  };
}
