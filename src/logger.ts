import crypto from "node:crypto";

export interface AuditEntry {
  timestamp: string;
  correlationId: string;
  tool: string;
  domain?: string;
  outcome: "success" | "error" | "denied";
  detail?: string;
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function audit(entry: AuditEntry): void {
  const line = JSON.stringify(entry);
  process.stderr.write(`[AUDIT] ${line}\n`);
}

export function logInfo(message: string): void {
  process.stderr.write(`[INFO] ${message}\n`);
}

export function logError(message: string): void {
  process.stderr.write(`[ERROR] ${message}\n`);
}
