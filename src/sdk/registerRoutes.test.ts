import { describe, expect, test, vi } from "vitest";
import { registerRoutes } from "./registerRoutes";
import { api } from "../component/_generated/api";
import { httpRouter } from "convex/server";
import { convexTest } from "convex-test";
import schema from "../component/schema";
import { modules } from "../component/setup.test";
import { storeHandler } from "../component/tokens";
import * as store from "../component/store";

describe("registerRoutes", () => {
  test.each(["PUT", "GET"])(
    "%s should return 401 with no token",
    async (method) => {
      const http = httpRouter();
      // @ts-expect-error It's ok
      registerRoutes(api, http);

      const t = convexTest(schema, {
        "./http.ts": () => Promise.resolve({ default: http }),
        ...modules,
      });

      await t.run(async (ctx) => {
        const result = await storeHandler(ctx, { token: "valid" });
        expect(result).toBe("valid");
      });

      const res = await t.fetch("/ld/webhook", {
        method,
      });
      expect(res.status).toBe(401);
    }
  );

  test.each(["PUT", "GET"])(
    "%s should return 401 with invalid token",
    async (method) => {
      const http = httpRouter();
      // @ts-expect-error It's ok
      registerRoutes(api, http);

      const t = convexTest(schema, {
        "./http.ts": () => Promise.resolve({ default: http }),
        ...modules,
      });

      await t.run(async (ctx) => {
        const result = await storeHandler(ctx, { token: "valid" });
        expect(result).toBe("valid");
      });

      const res = await t.fetch("/ld/webhook", {
        method,
        headers: {
          Authorization: "Bearer invalid",
        },
      });
      expect(res.status).toBe(401);
    }
  );

  test("GET should return 200 with valid token", async () => {
    const http = httpRouter();
    // @ts-expect-error It's ok
    registerRoutes(api, http);

    const t = convexTest(schema, {
      "./http.ts": () => Promise.resolve({ default: http }),
      ...modules,
    });

    await t.run(async (ctx) => {
      const result = await storeHandler(ctx, { token: "valid" });
      expect(result).toBe("valid");
    });

    const res = await t.fetch("/ld/webhook", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid",
      },
    });
    expect(res.status).toBe(200);
  });

  test("PUT should return 200 with valid token and storeToken the payload", async () => {
    spyOnMutation(store, "write");

    const http = httpRouter();
    // @ts-expect-error It's ok
    registerRoutes(api, http);

    const t = convexTest(schema, {
      "./http.ts": () => Promise.resolve({ default: http }),
      ...modules,
    });

    await t.run(async (ctx) => {
      const result = await storeHandler(ctx, { token: "valid" });
      expect(result).toBe("valid");
    });

    const res = await t.fetch("/ld/webhook", {
      method: "PUT",
      headers: {
        Authorization: "Bearer valid",
      },
      body: JSON.stringify({ flags: {}, segments: {} }),
    });

    expect(res.status).toBe(200);
    expect(store.write).toHaveBeenCalledOnce();
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spyOnMutation(api: any, method: string) {
  const spy = vi.spyOn(api, method);
  // @ts-expect-error It's a query ;)
  spy.isMutation = true;
  // @ts-expect-error Ignore validators
  spy.exportArgs = () => "{}";
  return spy;
}
