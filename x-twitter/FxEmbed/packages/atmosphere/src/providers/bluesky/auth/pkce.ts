const PKCE_VERIFIER_MIN = 43;
const PKCE_VERIFIER_MAX = 128;

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(buf: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** RFC 7636: 43–128 chars URL-safe base64 (we use 64 random bytes → ~86 chars). */
export function generatePkceVerifier(): string {
  const len = 64; // bytes → ~86 char string, within max
  return randomBase64Url(len);
}

export async function pkceChallengeFromVerifier(verifier: string): Promise<string> {
  const enc = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return base64UrlEncode(new Uint8Array(digest));
}

export function isValidPkceVerifier(v: string): boolean {
  return v.length >= PKCE_VERIFIER_MIN && v.length <= PKCE_VERIFIER_MAX;
}
