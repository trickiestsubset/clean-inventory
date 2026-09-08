// Uses the Web Crypto API (available in both the Next.js Edge middleware
// runtime and the Node.js server actions runtime) instead of node:crypto, so
// this file works in both places without extra config.

export const AUTH_COOKIE = "ci_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error(
      "Missing SESSION_SECRET environment variable. Set it to a long random string."
    );
  }
  return value;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return toHex(buf);
}

async function hmacHex(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(sig);
}

// The cookie value is "<expiry-timestamp>.<hmac>" so it can be verified
// without a database lookup and can't be forged without knowing SESSION_SECRET.
export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + ONE_YEAR_SECONDS * 1000;
  const payload = String(expires);
  const mac = await hmacHex(payload);
  return `${payload}.${mac}`;
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;

  const expected = await hmacHex(payload);
  if (expected.length !== mac.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
  }
  if (diff !== 0) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

export async function checkPasscode(candidate: string): Promise<boolean> {
  const real = process.env.APP_PASSCODE;
  if (!real) {
    throw new Error("Missing APP_PASSCODE environment variable.");
  }
  // Compare hashes (rather than the raw strings) as a simple, dependency-free
  // way to avoid short-circuiting string comparisons.
  const [a, b] = await Promise.all([sha256Hex(candidate), sha256Hex(real)]);
  return a === b;
}

export const SESSION_MAX_AGE = ONE_YEAR_SECONDS;
