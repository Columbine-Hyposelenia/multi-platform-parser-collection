/**
 * RFC 9449: detect `use_dpop_nonce` from `WWW-Authenticate`, or infer it when the server
 * returns `DPoP-Nonce` on an error without `WWW-Authenticate` (Bluesky PAR does this — see
 * https://github.com/bluesky-social/atproto/issues/3078).
 */
export function responseRequestsDpopNonce(res: Response): boolean {
  const www = res.headers.get('www-authenticate') ?? res.headers.get('WWW-Authenticate') ?? '';
  if (/use_dpop_nonce/i.test(www)) return true;
  if (!res.ok && readDpopNonceFromResponse(res)) return true;
  return false;
}

export function readDpopNonceFromResponse(res: Response): string | undefined {
  const n = res.headers.get('dpop-nonce') ?? res.headers.get('DPoP-Nonce');
  return n?.trim() || undefined;
}

export function formEncode(params: Record<string, string>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return parts.join('&');
}

export function parseOAuthCallbackUrl(input: string | URL): {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
} {
  const u = input instanceof URL ? input : new URL(input);
  const code = u.searchParams.get('code') ?? undefined;
  const state = u.searchParams.get('state') ?? undefined;
  const error = u.searchParams.get('error') ?? undefined;
  const error_description = u.searchParams.get('error_description') ?? undefined;
  return { code, state, error, error_description };
}

export function parseFormBody(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of text.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq < 0) {
      out[decodeURIComponent(pair)] = '';
    } else {
      out[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
    }
  }
  return out;
}
