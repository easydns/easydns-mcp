#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig, Config } from "./auth.js";
import { EasyDNSClient } from "./client.js";
import { PolicyError } from "./policy.js";
import { logInfo, logError, audit, createCorrelationId } from "./logger.js";
import { ZodError, type ZodObject, type ZodRawShape } from "zod";
import {
  domainListSchema,
  domainInfoSchema,
  dnsRecordsListSchema,
  dnsRecordsParsedSchema,
  dnsRecordsSearchSchema,
  zoneSOASchema,
  nameserversGetSchema,
  mailmapsListSchema,
  registrationStatusSchema,
  domainCheckSchema,
  dnsRecordAddSchema,
  dnsRecordModifySchema,
  dnsRecordDeleteSchema,
  zoneReloadSchema,
  nameserversUpdateSchema,
  mailmapsCreateSchema,
  mailmapsDeleteSchema,
} from "./schemas.js";

// Tool imports
import * as domainList from "./tools/domain-list.js";
import * as domainInfo from "./tools/domain-info.js";
import * as dnsRecordsList from "./tools/dns-records-list.js";
import * as dnsRecordsParsed from "./tools/dns-records-parsed.js";
import * as dnsRecordsSearch from "./tools/dns-records-search.js";
import * as zoneSoa from "./tools/zone-soa.js";
import * as nameserversGet from "./tools/nameservers-get.js";
import * as mailmapsList from "./tools/mailmaps-list.js";
import * as registrationStatus from "./tools/registration-status.js";
import * as domainCheck from "./tools/domain-check.js";
import * as dnsRecordAdd from "./tools/dns-record-add.js";
import * as dnsRecordModify from "./tools/dns-record-modify.js";
import * as dnsRecordDelete from "./tools/dns-record-delete.js";
import * as zoneReload from "./tools/zone-reload.js";
import * as nameserversUpdate from "./tools/nameservers-update.js";
import * as mailmapsCreate from "./tools/mailmaps-create.js";
import * as mailmapsDelete from "./tools/mailmaps-delete.js";

// Resource imports
import * as geoRegions from "./resources/geo-regions.js";
import * as serviceInfo from "./resources/service-info.js";
import * as subscriptionInfo from "./resources/subscription-info.js";

type ToolEntry = {
  name: string;
  description: string;
  schema: ZodObject<ZodRawShape>;
  handler: (args: unknown, client: EasyDNSClient, config: Config) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>;
};

async function main() {
  const config = loadConfig();
  const client = new EasyDNSClient(config);

  const server = new McpServer({
    name: "easydns-mcp",
    version: "0.1.0",
  });

  // Register all tools with Zod schemas
  const tools: ToolEntry[] = [
    // Phase A — read-only
    { name: "domain_list", description: domainList.definition.description, schema: domainListSchema, handler: domainList.handler },
    { name: "domain_info", description: domainInfo.definition.description, schema: domainInfoSchema, handler: domainInfo.handler },
    { name: "dns_records_list", description: dnsRecordsList.definition.description, schema: dnsRecordsListSchema, handler: dnsRecordsList.handler },
    { name: "dns_records_parsed", description: dnsRecordsParsed.definition.description, schema: dnsRecordsParsedSchema, handler: dnsRecordsParsed.handler },
    { name: "dns_records_search", description: dnsRecordsSearch.definition.description, schema: dnsRecordsSearchSchema, handler: dnsRecordsSearch.handler },
    { name: "zone_soa", description: zoneSoa.definition.description, schema: zoneSOASchema, handler: zoneSoa.handler },
    { name: "nameservers_get", description: nameserversGet.definition.description, schema: nameserversGetSchema, handler: nameserversGet.handler },
    { name: "mailmaps_list", description: mailmapsList.definition.description, schema: mailmapsListSchema, handler: mailmapsList.handler },
    { name: "registration_status", description: registrationStatus.definition.description, schema: registrationStatusSchema, handler: registrationStatus.handler },
    { name: "domain_check", description: domainCheck.definition.description, schema: domainCheckSchema, handler: domainCheck.handler },
    // Phase B — write (gated by policy)
    { name: "dns_record_add", description: dnsRecordAdd.definition.description, schema: dnsRecordAddSchema, handler: dnsRecordAdd.handler },
    { name: "dns_record_modify", description: dnsRecordModify.definition.description, schema: dnsRecordModifySchema, handler: dnsRecordModify.handler },
    { name: "dns_record_delete", description: dnsRecordDelete.definition.description, schema: dnsRecordDeleteSchema, handler: dnsRecordDelete.handler },
    { name: "zone_reload", description: zoneReload.definition.description, schema: zoneReloadSchema, handler: zoneReload.handler },
    { name: "nameservers_update", description: nameserversUpdate.definition.description, schema: nameserversUpdateSchema, handler: nameserversUpdate.handler },
    { name: "mailmaps_create", description: mailmapsCreate.definition.description, schema: mailmapsCreateSchema, handler: mailmapsCreate.handler },
    { name: "mailmaps_delete", description: mailmapsDelete.definition.description, schema: mailmapsDeleteSchema, handler: mailmapsDelete.handler },
  ];

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      tool.schema.shape,
      async (args: Record<string, unknown>) => {
        try {
          return await tool.handler(args, client, config);
        } catch (err) {
          const cid = createCorrelationId();

          if (err instanceof PolicyError) {
            audit({
              timestamp: new Date().toISOString(),
              correlationId: cid,
              tool: tool.name,
              outcome: "denied",
              detail: err.message,
            });
            return {
              content: [{ type: "text" as const, text: `Policy denied: ${err.message}` }],
              isError: true,
            };
          }

          if (err instanceof ZodError) {
            audit({
              timestamp: new Date().toISOString(),
              correlationId: cid,
              tool: tool.name,
              outcome: "error",
              detail: `Validation: ${err.message}`,
            });
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Validation error: ${err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
                },
              ],
              isError: true,
            };
          }

          const message = err instanceof Error ? err.message : "Unknown error";
          logError(`Tool ${tool.name} error: ${message}`);
          audit({
            timestamp: new Date().toISOString(),
            correlationId: cid,
            tool: tool.name,
            outcome: "error",
            detail: message,
          });
          return {
            content: [{ type: "text" as const, text: `Error: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }

  // Register resources
  server.resource("geo-regions", geoRegions.definition.uri, async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: await geoRegions.handler(client),
      },
    ],
  }));

  server.resource(
    "service-info",
    "easydns://service/{service_id}",
    async (uri) => {
      const match = uri.href.match(/service\/(\d+)/);
      const serviceId = match ? parseInt(match[1], 10) : 0;
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: await serviceInfo.handler(client, serviceId),
          },
        ],
      };
    }
  );

  server.resource(
    "subscription-info",
    "easydns://subscription/{subscription_id}",
    async (uri) => {
      const match = uri.href.match(/subscription\/(\d+)/);
      const subscriptionId = match ? parseInt(match[1], 10) : 0;
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: await subscriptionInfo.handler(client, subscriptionId),
          },
        ],
      };
    }
  );

  // Start server
  const transport = new StdioServerTransport();
  logInfo(
    `easyDNS MCP server starting (sandbox=${config.sandbox}, writes=${config.enableWrites})`
  );
  await server.connect(transport);
}

main().catch((err) => {
  logError(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
