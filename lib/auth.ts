const enc = new TextEncoder();

export const SESSION_COOKIE = "dealhub_admin";

function getAdminCredentials() {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) {
    throw new Error("ADMIN_USER and ADMIN_PASS must be set");
  }
  return { user, pass };
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return bufferToHex(signature);
}

export function verifyCredentials(username: string, password: string): boolean {
  const { user, pass } = getAdminCredentials();
  return (
    timingSafeEqualString(username, user) &&
    timingSafeEqualString(password, pass)
  );
}

export async function createSessionToken(): Promise<string> {
  const { user, pass } = getAdminCredentials();
  const payload = `admin:${user}`;
  const signature = await sign(payload, pass);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  try {
    const { user, pass } = getAdminCredentials();
    const expectedPayload = `admin:${user}`;
    if (payload !== expectedPayload) return false;
    const expected = await sign(payload, pass);
    return timingSafeEqualString(signature, expected);
  } catch {
    return false;
  }
}
