import { dpopAthFromAccessToken, signDpopProof } from './dpop.js';
import type { BlueskyAuthSession } from './types.js';
import { refreshBlueskyTokens } from './tokens.js';
import { BlueskyAuthError } from '../../../transports/errors.js';
import { readDpopNonceFromResponse, responseRequestsDpopNonce } from './oauth-http.js';

type BlueskyXrpcParams = Record<string, string | number | boolean | undefined | string[]>;

function trimBaseUrl(base: string): string {
  return base.replace(/\/$/, '');
}

function paramsToSearchString(params: BlueskyXrpcParams): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) qs.append(k, String(item));
    } else {
      qs.set(k, String(v));
    }
  }
  return qs.toString();
}

function buildXrpcUrl(baseUrl: string, lexiconMethod: string, params: BlueskyXrpcParams): string {
  const qs = paramsToSearchString(params);
  const q = qs ? `?${qs}` : '';
  return `${trimBaseUrl(baseUrl)}/xrpc/${lexiconMethod}${q}`;
}

async function ensureFreshAccess(
  session: BlueskyAuthSession,
  skewMs: number,
  fetchImpl: typeof fetch
): Promise<BlueskyAuthSession> {
  if (session.accessExpiresAtMs <= Date.now() + skewMs) {
    return refreshBlueskyTokens({ session, fetchImpl });
  }
  return session;
}

export type AuthenticatedXrpcOptions = {
  session: BlueskyAuthSession;
  /** Defaults to `session.pdsOrigin`. */
  baseUrl?: string;
  lexiconMethod: string;
  method?: 'GET' | 'POST';
  query?: BlueskyXrpcParams;
  body?: unknown;
  fetchImpl?: typeof fetch;
  /** Refresh access token this many ms before expiry (default 120s). */
  refreshSkewMs?: number;
};

/**
 * Call an XRPC method on the user's PDS with `Authorization: DPoP <access_token>` + `DPoP` proof
 * (`ath` = SHA256 of access token). Retries once on `use_dpop_nonce`; on 401 refreshes once then retries.
 */
export async function authenticatedXrpc<T>(opts: AuthenticatedXrpcOptions): Promise<{
  data: T;
  session: BlueskyAuthSession;
}> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const method = opts.method ?? 'GET';
  const base = trimBaseUrl(opts.baseUrl ?? opts.session.pdsOrigin);
  const query = opts.query ?? {};
  const url = buildXrpcUrl(base, opts.lexiconMethod, query);
  const htu = url.includes('?') ? url.slice(0, url.indexOf('?')) : url;

  let session = await ensureFreshAccess(opts.session, opts.refreshSkewMs ?? 120_000, fetchImpl);

  const sendOnce = async (nonce: string | undefined): Promise<Response> => {
    const proof = await signDpopProof({
      keypair: session.dpop,
      htm: method,
      htu,
      nonce,
      ath: await dpopAthFromAccessToken(session.accessToken)
    });
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `DPoP ${session.accessToken}`,
      DPoP: proof
    };
    if (nonce) headers['DPoP-Nonce'] = nonce;
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
      return fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(opts.body ?? {})
      });
    }
    return fetchImpl(url, { method: 'GET', headers });
  };

  const sendWithNonceRetry = async (): Promise<Response> => {
    let res = await sendOnce(session.dpopNonce);
    if (responseRequestsDpopNonce(res)) {
      const n = readDpopNonceFromResponse(res) ?? session.dpopNonce;
      if (n) {
        session = { ...session, dpopNonce: n };
        res = await sendOnce(n);
      }
    }
    return res;
  };

  let res = await sendWithNonceRetry();
  if (res.status === 401) {
    session = await refreshBlueskyTokens({ session, fetchImpl });
    res = await sendWithNonceRetry();
  }

  const text = await res.text();
  if (!res.ok) {
    throw new BlueskyAuthError(
      'invalid_request',
      `XRPC ${opts.lexiconMethod} failed: ${res.status}`,
      {
        status: res.status,
        body: text
      }
    );
  }
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new BlueskyAuthError('network', 'XRPC invalid JSON', { status: res.status, body: text });
  }
  const dpopNonce = readDpopNonceFromResponse(res);
  return {
    data,
    session: dpopNonce ? { ...session, dpopNonce } : session
  };
}
