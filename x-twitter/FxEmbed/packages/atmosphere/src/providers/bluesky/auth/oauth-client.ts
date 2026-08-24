import { buildBlueskyClientMetadata } from './client-metadata.js';
import { generateDpopKeypair } from './dpop.js';
import { resolveBlueskyIdentity } from './identity.js';
import { fetchAuthServerMetadata } from './metadata.js';
import { parseOAuthCallbackUrl } from './oauth-http.js';
import { buildAuthorizationUrl, pushAuthorizationRequest } from './par.js';
import { generatePkceVerifier, pkceChallengeFromVerifier } from './pkce.js';
import { exchangeAuthorizationCode, refreshBlueskyTokens } from './tokens.js';
import type {
  AuthorizationStartResult,
  BlueskyAuthSession,
  BlueskyOAuthClientConfig,
  BlueskyOAuthTransientState
} from './types.js';
import { BlueskyAuthError } from '../../../transports/errors.js';

/** Default read-oriented scopes for Bluesky OAuth (adjust if upstream rejects). */
export const DEFAULT_BLUESKY_OAUTH_SCOPE = 'atproto transition:generic';

export type CreateBlueskyOAuthClientParams = BlueskyOAuthClientConfig & {
  redirectUri: string;
  /** Used when `startAuthorization()` is called without a `loginHint`. */
  defaultLoginHint?: string;
  fetchImpl?: typeof fetch;
};

function randomBase64Url(bytes: number): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  let bin = '';
  for (let i = 0; i < a.length; i++) bin += String.fromCharCode(a[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * High-level Bluesky OAuth (PKCE + DPoP + PAR when available). Stateless: consumers persist
 * {@link BlueskyOAuthTransientState} and {@link BlueskyAuthSession}.
 */
export function createBlueskyOAuthClient(params: CreateBlueskyOAuthClientParams) {
  const fetchImpl = params.fetchImpl ?? fetch;
  const { redirectUri } = params;

  async function startAuthorization(loginHint?: string): Promise<AuthorizationStartResult> {
    const hint = (loginHint ?? params.defaultLoginHint)?.trim();
    if (!hint) {
      throw new Error(
        'createBlueskyOAuthClient: pass loginHint to startAuthorization or set defaultLoginHint'
      );
    }
    const identity = await resolveBlueskyIdentity(hint, fetchImpl);
    const metadata = await fetchAuthServerMetadata(identity.authServerOrigin, fetchImpl);
    const pkceVerifier = generatePkceVerifier();
    const pkceChallenge = await pkceChallengeFromVerifier(pkceVerifier);
    const state = randomBase64Url(24);
    const dpop = await generateDpopKeypair();
    const { clientId, scope } = params;

    const par = await pushAuthorizationRequest({
      metadata,
      clientId,
      redirectUri,
      scope,
      state,
      pkceChallenge,
      loginHint: hint,
      dpop,
      fetchImpl
    });

    const authUrl = buildAuthorizationUrl({
      metadata,
      clientId,
      redirectUri,
      scope,
      state,
      pkceChallenge,
      loginHint: hint,
      requestUri: par?.requestUri
    });

    const transientState: BlueskyOAuthTransientState = {
      pkceVerifier,
      state,
      dpop,
      clientId,
      redirectUri,
      scope,
      loginHint: hint,
      did: identity.did,
      handle: identity.handle,
      pdsOrigin: identity.pdsOrigin,
      authServerOrigin: identity.authServerOrigin,
      tokenEndpoint: metadata.token_endpoint,
      authorizationEndpoint: metadata.authorization_endpoint,
      oauthDpopNonce: par?.dpopNonce
    };

    return { authUrl, transientState };
  }

  async function completeAuthorization(
    callbackUrl: string | URL,
    transientState: BlueskyOAuthTransientState
  ): Promise<{ session: BlueskyAuthSession }> {
    const parsed = parseOAuthCallbackUrl(callbackUrl);
    if (parsed.error) {
      throw new BlueskyAuthError(
        'invalid_request',
        parsed.error_description ?? parsed.error ?? 'OAuth error',
        {}
      );
    }
    if (!parsed.code) {
      throw new BlueskyAuthError('invalid_request', 'OAuth callback missing code', {});
    }
    if (parsed.state !== transientState.state) {
      throw new BlueskyAuthError('invalid_request', 'OAuth state mismatch', {});
    }

    const bundle = await exchangeAuthorizationCode({
      tokenEndpoint: transientState.tokenEndpoint,
      clientId: transientState.clientId,
      redirectUri: transientState.redirectUri,
      code: parsed.code,
      pkceVerifier: transientState.pkceVerifier,
      dpop: transientState.dpop,
      dpopNonce: transientState.oauthDpopNonce,
      fetchImpl
    });

    const session: BlueskyAuthSession = {
      did: transientState.did,
      handle: transientState.handle,
      pdsOrigin: transientState.pdsOrigin,
      authServerOrigin: transientState.authServerOrigin,
      oauthClientId: transientState.clientId,
      tokenEndpoint: transientState.tokenEndpoint,
      accessToken: bundle.accessToken,
      refreshToken: bundle.refreshToken,
      accessExpiresAtMs: bundle.accessExpiresAtMs,
      dpop: transientState.dpop,
      dpopNonce: bundle.dpopNonce,
      scope: bundle.scope
    };
    return { session };
  }

  async function refreshIfNeeded(
    session: BlueskyAuthSession
  ): Promise<{ session: BlueskyAuthSession }> {
    if (session.accessExpiresAtMs <= Date.now() + 120_000) {
      return { session: await refreshBlueskyTokens({ session, fetchImpl }) };
    }
    return { session };
  }

  return {
    startAuthorization,
    completeAuthorization,
    refreshIfNeeded,
    getClientMetadata: () => buildBlueskyClientMetadata(params)
  };
}
