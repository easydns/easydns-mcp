import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  checkConfirmation,
} from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { zoneReloadSchema } from "../schemas.js";

export const definition = {
  name: "zone_reload",
  description:
    'Force regeneration of a DNS zone. Requires EASYDNS_ENABLE_WRITES=true and confirm: "RELOAD".',
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
      confirm: {
        type: "string",
        description: 'Must be "RELOAD" to confirm zone regeneration',
      },
    },
    required: ["domain", "confirm"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = zoneReloadSchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  checkConfirmation(params.confirm, "RELOAD", "zone_reload");
  const cid = createCorrelationId();

  const res = await client.request({
    method: "GET",
    path: `/zones/reload/${encodeURIComponent(params.domain)}/force`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "zone_reload",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Zone reload triggered for ${params.domain}.\n\n${JSON.stringify(res.data, null, 2)}`,
      },
    ],
  };
}
