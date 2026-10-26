type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

/**
 * Canonical Cloudflare Turnstile siteverify. Fail closed on any error.
 */
export async function verifyTurnstileToken({
  token,
  remoteip,
  expectedAction,
}: {
  token: FormDataEntryValue | null;
  remoteip?: string | null;
  expectedAction: string;
}): Promise<boolean> {
  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );
  const secret = process.env.TURNSTILE_SECRET;

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0 ||
    typeof secret !== "string" ||
    secret.length === 0
  ) {
    return false;
  }

  let result: SiteverifyResult;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (typeof remoteip === "string" && remoteip.length > 0) {
      body.set("remoteip", remoteip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
        body,
      }
    );
    if (!response.ok) {
      return false;
    }
    result = (await response.json()) as SiteverifyResult;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }

  return (
    result.success === true &&
    result.action === expectedAction &&
    typeof result.hostname === "string" &&
    expectedHostnames.has(result.hostname)
  );
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return undefined;
  const first = forwarded.split(",")[0]?.trim();
  return first || undefined;
}
