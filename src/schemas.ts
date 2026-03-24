import { z } from "zod";

const domainSchema = z
  .string()
  .min(1)
  .describe("Domain name (e.g., example.com)");

const rrTypeSchema = z
  .enum([
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
  ])
  .describe("DNS record type");

// Phase A — read-only tools

export const domainListSchema = z.object({
  user: z.string().min(1).describe("easyDNS username"),
});

export const domainInfoSchema = z.object({
  domain: domainSchema,
});

export const dnsRecordsListSchema = z.object({
  domain: domainSchema,
});

export const dnsRecordsParsedSchema = z.object({
  domain: domainSchema,
});

export const dnsRecordsSearchSchema = z.object({
  domain: domainSchema,
  keyword: z.string().min(1).describe("Search keyword"),
});

export const zoneSOASchema = z.object({
  domain: domainSchema,
});

export const nameserversGetSchema = z.object({
  domain: domainSchema,
});

export const mailmapsListSchema = z.object({
  domain: domainSchema,
});

export const registrationStatusSchema = z.object({});

export const domainCheckSchema = z.object({
  domain: domainSchema,
  service: z
    .enum(["lite", "dns", "pro", "enterprise"])
    .optional()
    .describe("Service level to check pricing for"),
  min_term: z.number().int().min(1).optional().describe("Minimum term in years"),
  max_term: z.number().int().min(1).optional().describe("Maximum term in years"),
});

// Phase B — write tools

export const dnsRecordAddSchema = z.object({
  domain: domainSchema,
  type: rrTypeSchema,
  host: z.string().min(1).describe("Hostname (use @ for zone apex)"),
  rdata: z.string().min(1).describe("Record data (e.g., IP address, target)"),
  ttl: z
    .number()
    .int()
    .min(300)
    .max(86400)
    .default(600)
    .describe("TTL in seconds (300-86400)"),
  prio: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(0)
    .describe("Priority (0-100, used for MX/SRV)"),
  geozone_id: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Geo zone ID (0 = no geo)"),
});

export const dnsRecordModifySchema = z.object({
  id: z.number().int().describe("Zone record ID to modify"),
  domain: domainSchema,
  type: rrTypeSchema,
  host: z.string().min(1).describe("Hostname (use @ for zone apex)"),
  rdata: z.string().min(1).describe("Record data"),
  ttl: z
    .number()
    .int()
    .min(300)
    .max(86400)
    .default(600)
    .describe("TTL in seconds (300-86400)"),
  prio: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(0)
    .describe("Priority (0-100)"),
  geozone_id: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Geo zone ID (0 = no geo)"),
});

export const dnsRecordDeleteSchema = z.object({
  domain: domainSchema,
  id: z.string().min(1).describe("Zone record ID to delete"),
  confirm: z
    .string()
    .describe('Must be "DELETE" to confirm this destructive operation'),
});

export const zoneReloadSchema = z.object({
  domain: domainSchema,
  confirm: z
    .string()
    .describe('Must be "RELOAD" to confirm zone regeneration'),
});

export const nameserversUpdateSchema = z.object({
  domain: domainSchema,
  nameservers: z
    .array(z.string().min(1))
    .min(2)
    .max(10)
    .describe("List of nameservers (2-10)"),
  confirm: z
    .string()
    .describe('Must be "UPDATE_NS" to confirm nameserver change'),
});

export const mailmapsCreateSchema = z.object({
  domain: domainSchema,
  alias: z.string().min(1).describe('Alias portion of mailmap (e.g., "info")'),
  host: z
    .string()
    .min(1)
    .default("@")
    .describe('Host for the alias (use "@" for domain root)'),
  destination: z
    .string()
    .email()
    .describe("Destination email address to forward to"),
  active: z
    .number()
    .int()
    .min(0)
    .max(1)
    .default(1)
    .describe("Whether the mailmap is active (0 or 1)"),
});

export const mailmapsDeleteSchema = z.object({
  domain: domainSchema,
  mailmap_id: z.number().int().min(1).describe("Mailmap ID to delete"),
  confirm: z
    .string()
    .describe('Must be "DELETE" to confirm mailmap deletion'),
});
