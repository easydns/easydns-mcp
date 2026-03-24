import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  checkConfirmation,
} from "../policy.js";
import { audit, createCorrelationId } from "../logger.js";
import { dnsRecordDeleteSchema } from "../schemas.js";

export const definition = {
  name: "dns_record_delete",
  description:
    'Delete a DNS zone record by ID. Requires EASYDNS_ENABLE_WRITES=true and confirm: "DELETE".',
  inputSchema: {
    type: "object" as const,
    properties: {
      domain: { type: "string", description: "Domain name" },
      id: { type: "string", description: "Zone record ID to delete" },
      confirm: {
        type: "string",
        description: 'Must be "DELETE" to confirm this destructive operation',
      },
    },
    required: ["domain", "id", "confirm"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const params = dnsRecordDeleteSchema.parse(args);
  checkWriteEnabled(config);
  checkDomainAllowed(params.domain, config);
  checkConfirmation(params.confirm, "DELETE", "dns_record_delete");
  const cid = createCorrelationId();

  const res = await client.request({
    method: "DELETE",
    path: `/zones/records/${encodeURIComponent(params.domain)}/${encodeURIComponent(params.id)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "dns_record_delete",
    domain: params.domain,
    outcome: res.ok ? "success" : "error",
    detail: `id=${params.id}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `Record ${params.id} deleted from ${params.domain}.\n\n${JSON.stringify(res.data, null, 2)}`,
      },
    ],
  };
}
