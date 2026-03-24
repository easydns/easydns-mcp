import dotenv from "dotenv";

dotenv.config();

export interface Credentials {
  token: string;
  apiKey: string;
}

export interface Config {
  credentials: Credentials;
  sandbox: boolean;
  enableWrites: boolean;
  allowProduction: boolean;
  allowDomainDelete: boolean;
  allowUserMutations: boolean;
  defaultDomain?: string;
  allowedDomains: string[];
  protectedDomains: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function envBool(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

function envList(name: string): string[] {
  const value = process.env[name];
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function loadConfig(): Config {
  return {
    credentials: {
      token: requireEnv("EASYDNS_TOKEN"),
      apiKey: requireEnv("EASYDNS_API_KEY"),
    },
    sandbox: envBool("EASYDNS_SANDBOX", true),
    enableWrites: envBool("EASYDNS_ENABLE_WRITES", false),
    allowProduction: envBool("EASYDNS_ALLOW_PRODUCTION", false),
    allowDomainDelete: envBool("EASYDNS_ALLOW_DOMAIN_DELETE", false),
    allowUserMutations: envBool("EASYDNS_ALLOW_USER_MUTATIONS", false),
    defaultDomain: process.env["EASYDNS_DOMAIN"] || undefined,
    allowedDomains: envList("EASYDNS_ALLOWED_DOMAINS"),
    protectedDomains: envList("EASYDNS_PROTECTED_DOMAINS"),
  };
}

export function getBaseUrl(config: Config): string {
  if (config.sandbox) {
    return "https://sandbox.rest.easydns.net";
  }
  if (!config.allowProduction) {
    throw new Error(
      "Production access requires EASYDNS_ALLOW_PRODUCTION=true"
    );
  }
  return "https://rest.easydns.net";
}

export function getAuthHeader(credentials: Credentials): string {
  const encoded = Buffer.from(
    `${credentials.token}:${credentials.apiKey}`
  ).toString("base64");
  return `Basic ${encoded}`;
}
