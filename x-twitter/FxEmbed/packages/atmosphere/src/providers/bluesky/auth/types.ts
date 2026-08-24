/** Serialized ES256 keypair for DPoP (persist in consumer session). */
export type DpopKeypairJwk = {
  readonly publicJwk: JsonWebKey;
  readonly privateJwk: JsonWebKey;
};

/**
 * Everything the consumer must persist after login (and refresh after each atmosphere call).
 * Stateless: pass the latest blob in, persist the blob returned.
 */
export type BlueskyAuthSession = {
  readonly did: string;
  /** Resolved handle when known (may update after session refresh). */
  handle?: string;
  /** PDS / resource base URL (no trailing slash), e.g. `https://porcini.us-east.host.bsky.network` */
  readonly pdsOrigin: string;
  /** OAuth authorization server issuer URL (no trailing slash). */
  readonly authServerOrigin: string;
  /** OAuth `client_id` (HTTPS URL of hosted `client_metadata.json`). */
  readonly oauthClientId: string;
  /** OAuth token endpoint (absolute URL). */
  readonly tokenEndpoint: string;
  accessToken: string;
  refreshToken: string;
  /** Access token expiry (epoch ms). */
  accessExpiresAtMs: number;
  readonly dpop: DpopKeypairJwk;
  /** Last `DPoP-Nonce` from upstream (optional until first response supplies one). */
  dpopNonce?: string;
  /** OAuth scopes granted (space-separated). */
  readonly scope?: string;
};

/** Ephemeral data between `startAuthorization` and `completeAuthorization` — never stored long-term. */
export type BlueskyOAuthTransientState = {
  readonly pkceVerifier: string;
  readonly state: string;
  readonly dpop: DpopKeypairJwk;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scope: string;
  readonly loginHint?: string;
  /** From identity resolution at start time. */
  readonly did: string;
  readonly handle?: string;
  readonly pdsOrigin: string;
  readonly authServerOrigin: string;
  readonly tokenEndpoint: string;
  readonly authorizationEndpoint: string;
  /** `DPoP-Nonce` from PAR (if any); pass to token exchange. */
  oauthDpopNonce?: string;
};

export type ResolvedBlueskyIdentity = {
  did: string;
  /** Best-effort display handle; may be the input if only DID was resolved. */
  handle: string;
  pdsOrigin: string;
  /** OAuth AS base URL (from PDS `com.atproto.server.describeServer` or well-known). */
  authServerOrigin: string;
};

/** Subset of OAuth AS + RS metadata needed for PAR / token / resource requests. */
export type AuthServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  /** Pushed Authorization Request endpoint (RFC 9126). */
  pushed_authorization_request_endpoint?: string;
  jwks_uri?: string;
  /** RFC 8414 style; optional. */
  revocation_endpoint?: string;
};

export type BlueskyOAuthClientConfig = {
  /** HTTPS URL where `client_metadata.json` is hosted; this is the OAuth `client_id`. */
  clientId: string;
  redirectUris: string[];
  /** Default requested scopes (space-separated), e.g. `atproto transition:generic`. */
  scope: string;
  /** `web` or `native` per ATProto OAuth client metadata. */
  applicationType?: 'web' | 'native';
  clientName?: string;
  clientUri?: string;
  logoUri?: string;
  policyUri?: string;
  tosUri?: string;
};

export type AuthorizationStartResult = {
  authUrl: string;
  transientState: BlueskyOAuthTransientState;
};
