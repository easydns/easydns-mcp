import { Config } from "../auth.js";
import { EasyDNSClient } from "../client.js";
import { audit, createCorrelationId } from "../logger.js";

export const definition = {
  name: "registration_status",
  description:
    "Get registration lock and renewal status for the user's domains.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export async function handler(
  args: unknown,
  client: EasyDNSClient,
  config: Config
) {
  const cid = createCorrelationId();

  const res = await client.request({
    method: "GET",
    path: "/domains/regstatus",
  });

  audit({
    timestamp: new Date().toISOString(),
    correlationId: cid,
    tool: "registration_status",
    outcome: res.ok ? "success" : "error",
  });

  if (!res.ok) {
    return { content: [{ type: "text" as const, text: `Error: ${JSON.stringify(res.data)}` }], isError: true };
  }

  return { content: [{ type: "text" as const, text: JSON.stringify(res.data, null, 2) }] };
}
