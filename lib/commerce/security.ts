const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const MAX_CSRF_TTL_MS = 2 * 60 * 60 * 1000;
const REDACTED = "[REDACTED]";
const SENSITIVE_KEY =
  /(?:authorization|cookie|password|secret|token|signature|api[-_]?key|email|address|licen[cs]e|object[-_]?key)/iu;

export type OriginDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "missing_origin" | "malformed_origin" | "origin_not_allowed";
    };

export function requireAllowedOrigin(input: {
  method: string;
  originHeader: string | null;
  allowedOrigins: readonly string[];
}): OriginDecision {
  if (SAFE_METHODS.has(input.method.toUpperCase())) {
    return { allowed: true };
  }
  if (!input.originHeader) {
    return { allowed: false, reason: "missing_origin" };
  }
  let origin: string;
  try {
    const parsed = new URL(input.originHeader);
    if (parsed.origin !== input.originHeader || parsed.username || parsed.password) {
      return { allowed: false, reason: "malformed_origin" };
    }
    origin = parsed.origin;
  } catch {
    return { allowed: false, reason: "malformed_origin" };
  }
  if (
    !input.allowedOrigins.some((allowed) => {
      try {
        return new URL(allowed).origin === origin;
      } catch {
        return false;
      }
    })
  ) {
    return { allowed: false, reason: "origin_not_allowed" };
  }
  return { allowed: true };
}

export async function createCsrfToken(input: {
  sessionId: string;
  now: number;
  ttlMs: number;
  secret: string | Uint8Array;
  nonceSource?: () => Uint8Array;
}): Promise<string> {
  if (
    !input.sessionId
    || !Number.isSafeInteger(input.now)
    || !Number.isSafeInteger(input.ttlMs)
    || input.ttlMs <= 0
    || input.ttlMs > MAX_CSRF_TTL_MS
  ) {
    throw new Error("Invalid CSRF token input");
  }
  const nonceBytes =
    (input.nonceSource ?? (() => crypto.getRandomValues(new Uint8Array(18))))();
  if (nonceBytes.byteLength < 16) {
    throw new Error("CSRF nonce must contain at least 128 bits");
  }
  const nonce = toBase64Url(nonceBytes);
  const expiresAt = input.now + input.ttlMs;
  const message = `${nonce}.${expiresAt}.${input.sessionId}`;
  const signature = await hmac(message, validateSecret(input.secret));
  return `${nonce}.${expiresAt}.${toBase64Url(signature)}`;
}

export async function verifyCsrfToken(input: {
  token: string;
  sessionId: string;
  now: number;
  secret: string | Uint8Array;
}): Promise<boolean> {
  if (!input.sessionId || input.token.length > 1024) return false;
  const parts = input.token.split(".");
  if (parts.length !== 3) return false;
  const [nonce, expiresAtValue, signatureValue] = parts;
  const expiresAt = Number(expiresAtValue);
  if (
    !nonce
    || !Number.isSafeInteger(expiresAt)
    || expiresAt <= input.now
  ) {
    return false;
  }
  try {
    return await verifyHmac(
      `${nonce}.${expiresAtValue}.${input.sessionId}`,
      fromBase64Url(signatureValue),
      validateSecret(input.secret),
    );
  } catch {
    return false;
  }
}

export function serializeSecureCookie(input: {
  name: string;
  value: string;
  maxAgeSeconds: number;
  production: boolean;
  sameSite?: "Strict" | "Lax";
  path?: string;
}): string {
  if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u.test(input.name)) {
    throw new Error("Invalid cookie name");
  }
  if (/[\u0000-\u0020\u007f;,]/u.test(input.value)) {
    throw new Error("Invalid cookie value");
  }
  if (
    !Number.isSafeInteger(input.maxAgeSeconds)
    || input.maxAgeSeconds <= 0
  ) {
    throw new Error("Invalid cookie lifetime");
  }
  const path = input.path ?? "/";
  if (!path.startsWith("/") || /[\u0000-\u001f;]/u.test(path)) {
    throw new Error("Invalid cookie path");
  }
  if (
    input.name.startsWith("__Host-")
    && (!input.production || path !== "/")
  ) {
    throw new Error("__Host- cookies require production Secure and Path=/");
  }
  if (input.name.startsWith("__Secure-") && !input.production) {
    throw new Error("__Secure- cookies require production Secure");
  }
  return [
    `${input.name}=${input.value}`,
    `Path=${path}`,
    `Max-Age=${input.maxAgeSeconds}`,
    "HttpOnly",
    `SameSite=${input.sameSite ?? "Lax"}`,
    ...(input.production ? ["Secure"] : []),
  ].join("; ");
}

export function scrubLogValue(value: unknown, maxDepth = 8): unknown {
  return scrub(value, new WeakSet<object>(), 0, maxDepth);
}

function scrub(
  value: unknown,
  seen: WeakSet<object>,
  depth: number,
  maxDepth: number,
): unknown {
  if (depth > maxDepth) return "[MAX_DEPTH]";
  if (typeof value === "string") return scrubString(value);
  if (
    value === null
    || typeof value === "number"
    || typeof value === "boolean"
    || typeof value === "undefined"
  ) {
    return value;
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubString(value.message),
    };
  }
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((entry) => scrub(entry, seen, depth + 1, maxDepth));
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY.test(key)
      ? REDACTED
      : scrub(entry, seen, depth + 1, maxDepth);
  }
  return result;
}

function scrubString(value: string): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/giu, `Bearer ${REDACTED}`)
    .replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
      REDACTED,
    )
    .replace(
      /([?&](?:token|signature|sig|key|secret)=)[^&#\s]+/giu,
      `$1${REDACTED}`,
    )
    .replace(/\/downloads\/[A-Za-z0-9._~-]+/gu, `/downloads/${REDACTED}`);
}

async function hmac(
  message: string,
  secret: Uint8Array,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      ownedArrayBuffer(new TextEncoder().encode(message)),
    ),
  );
}

async function verifyHmac(
  message: string,
  signature: Uint8Array,
  secret: Uint8Array,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    ownedArrayBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    ownedArrayBuffer(signature),
    ownedArrayBuffer(new TextEncoder().encode(message)),
  );
}

function validateSecret(secret: string | Uint8Array): Uint8Array {
  const value =
    typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  if (value.byteLength < 32) {
    throw new Error("Secret must contain at least 256 bits");
  }
  return value;
}

function toBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Invalid base64url");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/")
    + "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) =>
    character.charCodeAt(0));
}
import { ownedArrayBuffer } from "./crypto";
