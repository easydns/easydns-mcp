import { describe, it, expect } from "@jest/globals";
import {
  checkDomainAllowed,
  checkWriteEnabled,
  validateRRType,
  validateTTL,
  denyApexCNAME,
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

describe("policy", () => {
  describe("checkDomainAllowed", () => {
    it("allows any domain when no lists configured", () => {
      expect(() => checkDomainAllowed("example.com", makeConfig())).not.toThrow();
    });

    it("blocks protected domains", () => {
      const config = makeConfig({ protectedDomains: ["critical.com"] });
      expect(() => checkDomainAllowed("critical.com", config)).toThrow(PolicyError);
    });

    it("blocks domains not in allowlist", () => {
      const config = makeConfig({ allowedDomains: ["allowed.com"] });
      expect(() => checkDomainAllowed("other.com", config)).toThrow(PolicyError);
    });

    it("allows domains in allowlist", () => {
      const config = makeConfig({ allowedDomains: ["allowed.com"] });
      expect(() => checkDomainAllowed("allowed.com", config)).not.toThrow();
    });

    it("protected takes precedence over allowed", () => {
      const config = makeConfig({
        allowedDomains: ["both.com"],
        protectedDomains: ["both.com"],
      });
      expect(() => checkDomainAllowed("both.com", config)).toThrow(PolicyError);
    });
  });

  describe("checkWriteEnabled", () => {
    it("throws when writes disabled", () => {
      expect(() => checkWriteEnabled(makeConfig())).toThrow(PolicyError);
    });

    it("passes when writes enabled", () => {
      expect(() =>
        checkWriteEnabled(makeConfig({ enableWrites: true }))
      ).not.toThrow();
    });
  });

  describe("validateRRType", () => {
    it("accepts valid types", () => {
      for (const type of ["A", "AAAA", "CNAME", "MX", "TXT", "SRV"]) {
        expect(() => validateRRType(type)).not.toThrow();
      }
    });

    it("rejects invalid types", () => {
      expect(() => validateRRType("INVALID")).toThrow(PolicyError);
    });

    it("is case-insensitive", () => {
      expect(() => validateRRType("cname")).not.toThrow();
    });
  });

  describe("validateTTL", () => {
    it("accepts valid TTLs", () => {
      expect(() => validateTTL(300)).not.toThrow();
      expect(() => validateTTL(3600)).not.toThrow();
      expect(() => validateTTL(86400)).not.toThrow();
    });

    it("rejects TTL below minimum", () => {
      expect(() => validateTTL(60)).toThrow(PolicyError);
    });

    it("rejects TTL above maximum", () => {
      expect(() => validateTTL(100000)).toThrow(PolicyError);
    });
  });

  describe("denyApexCNAME", () => {
    it("blocks CNAME at @", () => {
      expect(() => denyApexCNAME("@", "CNAME")).toThrow(PolicyError);
    });

    it("blocks CNAME at empty string", () => {
      expect(() => denyApexCNAME("", "CNAME")).toThrow(PolicyError);
    });

    it("allows CNAME at subdomain", () => {
      expect(() => denyApexCNAME("www", "CNAME")).not.toThrow();
    });

    it("allows other types at apex", () => {
      expect(() => denyApexCNAME("@", "A")).not.toThrow();
    });
  });

  describe("checkConfirmation", () => {
    it("passes with correct confirmation", () => {
      expect(() => checkConfirmation("DELETE", "DELETE", "test")).not.toThrow();
    });

    it("fails with wrong confirmation", () => {
      expect(() => checkConfirmation("WRONG", "DELETE", "test")).toThrow(
        PolicyError
      );
    });

    it("fails with undefined confirmation", () => {
      expect(() => checkConfirmation(undefined, "DELETE", "test")).toThrow(
        PolicyError
      );
    });
  });
});
