import { dpopAthFromAccessToken, signDpopProof } from './dpop.js';
import type { BlueskyAuthSession, DpopKeypairJwk } from './types.js';
import { BlueskyAuthError } from '../../../transports/errors.js';
import {
  formEncode,
  parseFormBody,
  readDpopNonceFromResponse,
  responseRequestsDpopNonce
} from './oauth-http.js';

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAtMs: number;
  scope?: string;
  dpopNonce?: string;
};

async function postTokenForm(
  tokenEndpoint: string,
  body: Record<string, string>,
  dpop: DpopKeypairJwk,
  options: { dpopNonce?: string; athToken?: string; fetchImpl: typeof fetch }
): Promise<{ res: Response; text: string }> {
  const { fetchImpl } = options;
  const attempt = async (nonce: string | undefined, ath: string | undefined) => {
    const proof = await signDpopProof({
      keypair: dpop,
      htm: 'POST',
      htu: tokenEndpoint,
      nonce,
      ...(ath ? { ath: await dpopAthFromAccessToken(ath) } : {})
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'DPoP': proof
    };
    if (nonce) headers['DPoP-Nonce'] = nonce;
    return fetchImpl(tokenEndpoint, { method: 'POST', headers, body: formEncode(body) });
  };

  let res = await attempt(options.dpopNonce, options.athToken);
  if (responseRequestsDpopNonce(res)) {
    const n = readDpopNonceFromResponse(res) ?? options.dpopNonce;
    if (n) {
      res = await attempt(n, options.athToken);
    }
  }
  const text = await res.text();
  return { res, text };
}

function parseTokenJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return parseFormBody(text) as unknown as Record<string, unknown>;
  }
}

function bundleFromTokenResponse(
  j: Record<string, unknown>,
  dpopNonce: string | undefined
): TokenBundle {
  const accessToken = typeof j.access_token === 'string' ? j.access_token : '';
  const refreshToken = typeof j.refresh_token === 'string' ? j.refresh_token : '';
  if (!accessToken || !refreshToken) {
    throw new BlueskyAuthError(
      'invalid_request',
      'token response missing access_token or refresh_token',
      {
        body: JSON.stringify(j)
      }
    );
  }
  const expiresIn = typeof j.expires_in === 'number' ? j.expires_in : 3600;
  const accessExpiresAtMs = Date.now() + Math.max(30, expiresIn) * 1000;
  const scope = typeof j.scope === 'string' ? j.scope : undefined;
  return { accessToken, refreshToken, accessExpiresAtMs, scope, dpopNonce };
}

export async function exchangeAuthorizationCode(params: {
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
  code: string;
  pkceVerifier: string;
  dpop: DpopKeypairJwk;
  dpopNonce?: string;
  fetchImpl?: typeof fetch;
}): Promise<TokenBundle> {
  const fetchImpl = params.fetchImpl ?? fetch;
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    code: params.code,
    code_verifier: params.pkceVerifier
  };
  const { res, text } = await postTokenForm(params.tokenEndpoint, body, params.dpop, {
    dpopNonce: params.dpopNonce,
    fetchImpl
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      throw new BlueskyAuthError('invalid_request', `token exchange failed: ${res.status}`, {
        status: res.status,
        body: text
      });
    }
    throw new BlueskyAuthError('network', `token exchange failed: ${res.status}`, {
      status: res.status,
      body: text
    });
  }
  const j = parseTokenJson(text);
  const nextNonce = readDpopNonceFromResponse(res);
  return bundleFromTokenResponse(j, nextNonce ?? params.dpopNonce);
}

/** Refresh access token (DPoP `ath` = SHA256 of refresh token per RFC 9449). */
export async function refreshBlueskyTokens(params: {
  session: BlueskyAuthSession;
  fetchImpl?: typeof fetch;
}): Promise<BlueskyAuthSession> {
  const { session } = params;
  const fetchImpl = params.fetchImpl ?? fetch;
  const body: Record<string, string> = {
    grant_type: 'refresh_token',
    refresh_token: session.refreshToken,
    client_id: session.oauthClientId
  };
  const { res, text } = await postTokenForm(session.tokenEndpoint, body, session.dpop, {
    dpopNonce: session.dpopNonce,
    athToken: session.refreshToken,
    fetchImpl
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      const lower = text.toLowerCase();
      if (lower.includes('invalid_grant') || lower.includes('invalid_token')) {
        throw new BlueskyAuthError('refresh_invalid', 'refresh token rejected', {
          status: res.status,
          body: text
        });
      }
      throw new BlueskyAuthError('invalid_request', `token refresh failed: ${res.status}`, {
        status: res.status,
        body: text
      });
    }
    throw new BlueskyAuthError('network', `token refresh failed: ${res.status}`, {
      status: res.status,
      body: text
    });
  }
  const j = parseTokenJson(text);
  const bundle = bundleFromTokenResponse(j, readDpopNonceFromResponse(res) ?? session.dpopNonce);
  return {
    ...session,
    accessToken: bundle.accessToken,
    refreshToken: bundle.refreshToken,
    accessExpiresAtMs: bundle.accessExpiresAtMs,
    scope: bundle.scope ?? session.scope,
    dpopNonce: bundle.dpopNonce
  };
}
