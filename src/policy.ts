import { Config } from "./auth.js";

const VALID_RR_TYPES = new Set([
  "A",
  "AAAA",
  "AFSDB",
  "ANAME",
  "CAA",
  "CERT",
  "CNAME",
  "DYN",
  "MX",
  "NAPTR",
  "NS",
  "PTR",
  "SECONDARY",
  "SOA",
  "SPF",
  "SRV",
  "SSHFP",
  "STEALTH",
  "TLSA",
  "TXT",
  "URL",
  "URLHTTPS",
]);

const MAX_TTL = 86400;
const MIN_TTL = 300;

export class PolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyError";
  }
}

export function checkDomainAllowed(domain: string, config: Config): void {
  const d = domain.toLowerCase();

  if (config.protectedDomains.includes(d)) {
    throw new PolicyError(`Domain "${domain}" is on the protected list`);
  }

  if (
    config.allowedDomains.length > 0 &&
    !config.allowedDomains.includes(d)
  ) {
    throw new PolicyError(
      `Domain "${domain}" is not on the allowed list`
    );
  }
}

export function checkWriteEnabled(config: Config): void {
  if (!config.enableWrites) {
    throw new PolicyError(
      "Write operations are disabled. Set EASYDNS_ENABLE_WRITES=true to enable."
    );
  }
}

export function checkProductionAllowed(config: Config): void {
  if (!config.sandbox && !config.allowProduction) {
    throw new PolicyError(
      "Production access is disabled. Set EASYDNS_ALLOW_PRODUCTION=true to enable."
    );
  }
}

export function validateRRType(type: string): void {
  const upper = type.toUpperCase();
  if (!VALID_RR_TYPES.has(upper)) {
    throw new PolicyError(
      `Invalid record type "${type}". Valid types: ${[...VALID_RR_TYPES].join(", ")}`
    );
  }
}

export function validateTTL(ttl: number): void {
  if (ttl < MIN_TTL) {
    throw new PolicyError(`TTL ${ttl} is below minimum (${MIN_TTL})`);
  }
  if (ttl > MAX_TTL) {
    throw new PolicyError(`TTL ${ttl} exceeds maximum (${MAX_TTL})`);
  }
}

export function denyApexCNAME(host: string, type: string): void {
  if (type.toUpperCase() === "CNAME" && (host === "@" || host === "")) {
    throw new PolicyError(
      "CNAME at zone apex is not allowed (RFC 1034). Use ANAME instead."
    );
  }
}

export function checkConfirmation(
  confirm: string | undefined,
  expected: string,
  operation: string
): void {
  if (confirm !== expected) {
    throw new PolicyError(
      `Destructive operation "${operation}" requires confirm: "${expected}"`
    );
  }
}
