const WORKOS_API_KEY =
  /^sk_[A-Za-z0-9][A-Za-z0-9_-]{7,}$/u;

/**
 * WorkOS production keys use an opaque `sk_` prefix and do not carry a
 * `live` environment marker. Test keys may still contain `test` in the
 * opaque suffix, so validation must not infer the environment from the key.
 */
export function isValidWorkOSApiKey(value: string): boolean {
  return WORKOS_API_KEY.test(value);
}
