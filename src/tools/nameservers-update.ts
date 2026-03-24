import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  checkConfirmation,
} from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { nameserversUpdateSchema } from "../schemas.js";

export const definition = {
  name: "nameservers_update",
  description:
    'Update the nameservers for a domain. Requires EASYDNS_ENABLE_WRITES=true and confirm: "UPDATE_NS".',
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
      nameservers: {
        type: "array",
        items: { type: "string" },
        description: "List of nameservers (2-10)",
      },
      confirm: {
        type: "string",
        description: 'Must be "UPDATE_NS" to confirm nameserver change',
      },
    },
    required: ["domain", "nameservers", "confirm"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = nameserversUpdateSchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  checkConfirmation(params.confirm, "UPDATE_NS", "nameservers_update");
  const cid = createCorrelationId();

  const res = await client.request({
    method: "POST",
    path: `/domains/ns/${encodeURIComponent(params.domain)}`,
    body: { nameservers: params.nameservers },
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "nameservers_update",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
    detail: `ns=${params.nameservers.join(",")}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
