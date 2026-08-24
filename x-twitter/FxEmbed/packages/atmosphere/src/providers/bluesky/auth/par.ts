import type { AuthServerMetadata, DpopKeypairJwk } from './types.js';
import { signDpopProof } from './dpop.js';
import { formEncode, readDpopNonceFromResponse, responseRequestsDpopNonce } from './oauth-http.js';

export type PushParParams = {
  metadata: AuthServerMetadata;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  pkceChallenge: string;
  loginHint?: string;
  dpop: DpopKeypairJwk;
  dpopNonce?: string;
  fetchImpl?: typeof fetch;
};

export type PushParResult = {
  requestUri: string;
  expiresIn?: number;
  dpopNonce?: string;
};

/**
 * RFC 9126 Pushed Authorization Request (DPoP-bound POST).
 * If `pushed_authorization_request_endpoint` is missing from metadata, returns null (caller may use direct redirect).
 */
export async function pushAuthorizationRequest(
  params: PushParParams
): Promise<PushParResult | null> {
  const parUrl = params.metadata.pushed_authorization_request_endpoint;
  if (!parUrl) return null;

  const fetchImpl = params.fetchImpl ?? fetch;
  const body: Record<string, string> = {
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scope,
    state: params.state,
    code_challenge: params.pkceChallenge,
    code_challenge_method: 'S256',
    response_type: 'code'
  };
  if (params.loginHint) body.login_hint = params.loginHint;

  const attempt = async (nonce?: string) => {
    const proof = await signDpopProof({
      keypair: params.dpop,
      htm: 'POST',
      htu: parUrl,
      nonce
    });
    const res = await fetchImpl(parUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'DPoP': proof,
        ...(nonce ? { 'DPoP-Nonce': nonce } : {})
      },
      body: formEncode(body)
    });
    return res;
  };

  let res = await attempt(params.dpopNonce);
  if (responseRequestsDpopNonce(res)) {
    const n = readDpopNonceFromResponse(res);
    if (n) res = await attempt(n);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PAR failed: ${res.status} ${text.slice(0, 400)}`);
  }
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('PAR: response is not JSON');
  }
  const requestUri = typeof j.request_uri === 'string' ? j.request_uri : undefined;
  if (!requestUri) throw new Error('PAR: missing request_uri');
  const expiresIn = typeof j.expires_in === 'number' ? j.expires_in : undefined;
  const dpopNonce = readDpopNonceFromResponse(res);
  return { requestUri, expiresIn, dpopNonce };
}

export function buildAuthorizationUrl(params: {
  metadata: AuthServerMetadata;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  pkceChallenge: string;
  loginHint?: string;
  requestUri?: string;
}): string {
  const u = new URL(params.metadata.authorization_endpoint);
  u.searchParams.set('client_id', params.clientId);
  u.searchParams.set('redirect_uri', params.redirectUri);
  u.searchParams.set('scope', params.scope);
  u.searchParams.set('state', params.state);
  u.searchParams.set('response_type', 'code');
  if (params.requestUri) {
    u.searchParams.set('request_uri', params.requestUri);
  } else {
    u.searchParams.set('code_challenge', params.pkceChallenge);
    u.searchParams.set('code_challenge_method', 'S256');
  }
  if (params.loginHint) u.searchParams.set('login_hint', params.loginHint);
  return u.toString();
}
