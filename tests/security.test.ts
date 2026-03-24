import { describe, it, expect } from "@jest/globals";
import { getAuthHeader } from "../src/auth.js";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  checkConfirmation,
  PolicyError,
} from "../src/policy.js";
import { Config } from "../src/auth.js";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    credentials: { token: "test", apiKey: "test" },
    sandbox: true,
    enableWrites: false,
    allowProduction: false,
    allowDomainDelete: false,
    allowUserMutations: false,
    allowedDomains: [],
    protectedDomains: [],
    ...overrides,
  };
}

describe("security", () => {
  it("auth header does not leak raw credentials", () => {
    const header = getAuthHeader({ token: "secret_token", apiKey: "secret_key" });
    expect(header).not.toContain("secret_token");
    expect(header).not.toContain("secret_key");
    expect(header).toMatch(/^Basic [A-Za-z0-9+/]+=*$/);
  });

  it("default config blocks all writes", () => {
    const config = makeConfig();
    expect(() => checkWriteEnabled(config)).toThrow(PolicyError);
  });

  it("default config uses sandbox", () => {
    const config = makeConfig();
    expect(config.sandbox).toBe(true);
  });

  it("protected domains cannot be bypassed by case", () => {
    const config = makeConfig({ protectedDomains: ["critical.com"] });
    expect(() => checkDomainAllowed("CRITICAL.COM", config)).toThrow(PolicyError);
  });

  it("confirmation strings are exact match", () => {
    expect(() => checkConfirmation("delete", "DELETE", "test")).toThrow(PolicyError);
    expect(() => checkConfirmation("DELETE ", "DELETE", "test")).toThrow(PolicyError);
    expect(() => checkConfirmation(" DELETE", "DELETE", "test")).toThrow(PolicyError);
  });
});
