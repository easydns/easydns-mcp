import { EasyDNSClient } from "../client.js";

export const definition = {
  uri: "easydns://service/{service_id}",
  name: "Service Description",
  description: "Get description of an easyDNS service level by ID",
  mimeType: "application/json",
};

export async function handler(client: EasyDNSClient, serviceId: number) {
  const res = await client.request({
    method: "GET",
    path: `/services/${encodeURIComponent(String(serviceId))}/description`,
  });

  if (!res.ok) {
    return JSON.stringify({ error: "Failed to fetch service info", status: res.status });
  }

  return JSON.stringify(res.data, null, 2);
}
