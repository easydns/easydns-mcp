import { EasyDNSClient } from "../client.js";

export const definition = {
  uri: "easydns://geo-regions",
  name: "Geo Regions",
  description: "List of available geo region IDs for geo-aware DNS records",
  mimeType: "application/json",
};

export async function handler(client: EasyDNSClient) {
  const res = await client.request({
    method: "GET",
    path: "/zones/geo/region/list",
  });

  if (!res.ok) {
    return JSON.stringify({ error: "Failed to fetch geo regions", status: res.status });
  }

  return JSON.stringify(res.data, null, 2);
}
