import { describe, test, expect, beforeEach, vi } from "vitest";
import ConvexCrypto from "./crypto";

describe("ConvexCrypto", () => {
  let convexCrypto: ConvexCrypto;

  beforeEach(() => {
    convexCrypto = new ConvexCrypto();
  });

  describe("createHash", () => {
    test("should create a SHA1 hasher", () => {
      const hasher = convexCrypto.createHash("sha1");
      hasher.update("test");
      const digest = hasher.digest!("hex");
      expect(digest).toBe("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
    });

    test("should create a SHA256 hasher", () => {
      const hasher = convexCrypto.createHash("sha256");
      hasher.update("test");
      const digest = hasher.digest!("hex");
      expect(digest).toBe(
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
      );
    });

    test("should throw an error for unsupported hash algorithm", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => convexCrypto.createHash("md5" as any)).toThrow(
        "unsupported hash algorithm. Only sha1 and sha256 are supported."
      );
    });
  });

  describe("createHmac", () => {
    test("should create a SHA1 HMAC", () => {
      const hmac = convexCrypto.createHmac("sha1", "key");
      hmac.update("test");
      const digest = hmac.digest("hex");
      expect(digest).toBe("671f54ce0c540f78ffe1e26dcf9c2a047aea4fda");
    });

    test("should create a SHA256 HMAC", () => {
      const hmac = convexCrypto.createHmac("sha256", "key");
      hmac.update("test");
      const digest = hmac.digest("hex");
      expect(digest).toBe(
        "02afb56304902c656fcb737cdd03de6205bb6d401da2812efd9b2d36a08af159"
      );
    });

    test("should throw an error for unsupported hash algorithm", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => convexCrypto.createHmac("md5" as any, "key")).toThrow(
        "unsupported hash algorithm. Only sha1 and sha256 are supported."
      );
    });
  });

  describe("randomUUID", () => {
    test("should generate a valid UUID", () => {
      vi.stubGlobal("crypto", {
        randomUUID: vi.fn(),
      });
      convexCrypto.randomUUID();
      expect(crypto.randomUUID).toHaveBeenCalledOnce();
    });
  });
});
