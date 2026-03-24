import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { audit, createCorrelationId } from "../logger.js";
import { domainListSchema } from "../schemas.js";
import { ApiResponse, DomainListData } from "../types.js";

export const definition = {
  name: "domain_list",
  description:
    "List all domains associated with an easyDNS user account.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user: {
        type: "string",
        description: "easyDNS username",
      },
    },
    required: ["user"],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const { user } = domainListSchema.parse(args);
  const cid = createCorrelationId();

  const res = await client.request<ApiResponse<DomainListData>>({
    method: "GET",
    path: `/domains/list/${encodeURIComponent(user)}`,
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "domain_list",
    outcome: res.ok ? "success" : "error",
    detail: res.ok ? `Found ${res.data.data?.index?.length ?? 0} domains` : `HTTP ${res.status}`,
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
