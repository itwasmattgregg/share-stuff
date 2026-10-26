import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getClientIp, verifyTurnstileToken } from "./turnstile.server";

describe("verifyTurnstileToken", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "localhost,127.0.0.1";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects missing or oversized tokens without calling siteverify", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    expect(
      await verifyTurnstileToken({
        token: null,
        expectedAction: "signup",
      })
    ).toBe(false);
    expect(
      await verifyTurnstileToken({
        token: "",
        expectedAction: "signup",
      })
    ).toBe(false);
    expect(
      await verifyTurnstileToken({
        token: "x".repeat(2049),
        expectedAction: "signup",
      })
    ).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when hostnames or secret are unset", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    delete process.env.TURNSTILE_HOSTNAMES;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);

    process.env.TURNSTILE_HOSTNAMES = "localhost";
    delete process.env.TURNSTILE_SECRET;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a successful siteverify matching action and hostname", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "signup",
          hostname: "localhost",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    ) as unknown as typeof fetch;

    expect(
      await verifyTurnstileToken({
        token: "good-token",
        remoteip: "127.0.0.1",
        expectedAction: "signup",
      })
    ).toBe(true);
  });

  it("rejects wrong action, hostname, or siteverify failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "login",
          hostname: "localhost",
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "signup",
          hostname: "evil.example",
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 })
    ) as unknown as typeof fetch;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("nope", { status: 500 })
    ) as unknown as typeof fetch;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    expect(
      await verifyTurnstileToken({
        token: "token",
        expectedAction: "signup",
      })
    ).toBe(false);
  });
});

describe("getClientIp", () => {
  it("reads the first X-Forwarded-For hop", () => {
    expect(
      getClientIp(
        new Request("http://localhost", {
          headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
        })
      )
    ).toBe("1.2.3.4");
    expect(getClientIp(new Request("http://localhost"))).toBeUndefined();
  });
});
