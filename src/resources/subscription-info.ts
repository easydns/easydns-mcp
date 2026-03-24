import { EasyDNSClient } from "../client.js";

export const definition = {
  uri: "easydns://subscription/{subscription_id}",
  name: "Subscription Description",
  description: "Get description of an easyDNS subscription block by ID",
  mimeType: "application/json",
};

export async function handler(client: EasyDNSClient, subscriptionId: number) {
  const res = await client.request({
    method: "GET",
    path: `/services/subscription/${encodeURIComponent(String(subscriptionId))}/description`,
  });

  if (!res.ok) {
    return JSON.stringify({ error: "Failed to fetch subscription info", status: res.status });
  }

  return JSON.stringify(res.data, null, 2);
}
