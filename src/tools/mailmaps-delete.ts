import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  checkConfirmation,
} from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { mailmapsDeleteSchema } from "../schemas.js";

export const definition = {
  name: "mailmaps_delete",
  description:
    'Delete an email forwarding mailmap. Requires EASYDNS_ENABLE_WRITES=true and confirm: "DELETE".',
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
      mailmap_id: { type: "number", description: "Mailmap ID to delete" },
      confirm: {
        type: "string",
        description: 'Must be "DELETE" to confirm mailmap deletion',
      },
    },
    required: ["domain", "mailmap_id", "confirm"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = mailmapsDeleteSchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  checkConfirmation(params.confirm, "DELETE", "mailmaps_delete");
  const cid = createCorrelationId();

  const res = await client.request({
    method: "DELETE",
    path: `/mail/maps/${encodeURIComponent(params.domain)}/${encodeURIComponent(String(params.mailmap_id))}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "mailmaps_delete",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
    detail: `mailmap_id=${params.mailmap_id}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Mailmap ${params.mailmap_id} deleted from ${params.domain}.\n\n${JSON.stringify(res.data, null, 2)}`,
      },
    ],
  };
}
