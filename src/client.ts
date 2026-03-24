import { Config, getBaseUrl, getAuthHeader } from "./auth.js";
import { logError } from "./logger.js";

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  query?: Record<string, string | number>;
}

export interface ClientResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

export class EasyDNSClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: Config) {
    this.baseUrl = getBaseUrl(config);
    this.authHeader = getAuthHeader(config.credentials);
  }

  async request<T = unknown>(opts: RequestOptions): Promise<ClientResponse<T>> {
    let url = `${this.baseUrl}${opts.path}?format=json`;

    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      }
    }

    const fetchOpts: RequestInit = {
      method: opts.method,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
    };

    try {
      const response = await fetch(url, fetchOpts);
      let data: T;

      const text = await response.text();
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as unknown as T;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown fetch error";
      logError(`HTTP ${opts.method} ${opts.path} failed: ${message}`);
      throw new Error(`API request failed: ${message}`);
    }
  }
}
