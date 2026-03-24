import { describe, it, expect } from "@jest/globals";
import { getAuthHeader, getBaseUrl, Config } from "../src/auth.js";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    credentials: { token: "testtoken", apiKey: "testapikey" },
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

describe("auth", () => {
  describe("getAuthHeader", () => {
    it("produces valid Basic auth header", () => {
      const header = getAuthHeader({ token: "mytoken", apiKey: "mykey" });
      const decoded = Buffer.from(header.replace("Basic ", ""), "base64").toString();
      expect(decoded).toBe("mytoken:mykey");
    });
  });

  describe("getBaseUrl", () => {
    it("returns sandbox URL by default", () => {
      expect(getBaseUrl(makeConfig())).toBe("https://sandbox.rest.easydns.net");
    });

    it("returns production URL when allowed", () => {
      const config = makeConfig({ sandbox: false, allowProduction: true });
      expect(getBaseUrl(config)).toBe("https://rest.easydns.net");
    });

    it("throws when production not allowed", () => {
      const config = makeConfig({ sandbox: false, allowProduction: false });
      expect(() => getBaseUrl(config)).toThrow("Production access requires");
    });
  });
});
