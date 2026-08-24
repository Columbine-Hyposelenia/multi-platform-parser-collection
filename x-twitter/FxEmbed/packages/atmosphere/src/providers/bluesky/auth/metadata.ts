import type { AuthServerMetadata } from './types.js';

function trimOrigin(url: string): string {
  return url.replace(/\/$/, '');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Load OAuth authorization server metadata (RFC 8414) from the issuer base URL,
 * optionally after discovering the AS from the PDS protected-resource document.
 */
export async function fetchAuthServerMetadata(
  authServerIssuer: string,
  fetchImpl: typeof fetch = fetch
): Promise<AuthServerMetadata> {
  const issuer = trimOrigin(authServerIssuer);
  const wellKnown = `${issuer}/.well-known/oauth-authorization-server`;
  const res = await fetchImpl(wellKnown, {
    headers: { Accept: 'application/json' }
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `oauth-authorization-server metadata failed: ${res.status} ${text.slice(0, 200)}`
    );
  }
  let j: unknown;
  try {
    j = JSON.parse(text) as unknown;
  } catch {
    throw new Error('oauth-authorization-server metadata: invalid JSON');
  }
  if (!isRecord(j)) throw new Error('oauth-authorization-server metadata: expected object');

  const issuerStr = typeof j.issuer === 'string' ? j.issuer : issuer;
  const authorization_endpoint = j.authorization_endpoint;
  const token_endpoint = j.token_endpoint;
  if (typeof authorization_endpoint !== 'string' || typeof token_endpoint !== 'string') {
    throw new Error(
      'oauth-authorization-server metadata: missing authorization_endpoint or token_endpoint'
    );
  }

  return {
    issuer: trimOrigin(issuerStr),
    authorization_endpoint,
    token_endpoint,
    pushed_authorization_request_endpoint:
      typeof j.pushed_authorization_request_endpoint === 'string'
        ? j.pushed_authorization_request_endpoint
        : undefined,
    jwks_uri: typeof j.jwks_uri === 'string' ? j.jwks_uri : undefined,
    revocation_endpoint:
      typeof j.revocation_endpoint === 'string' ? j.revocation_endpoint : undefined
  };
}

/**
 * Discover authorization server issuer URLs from the PDS `/.well-known/oauth-protected-resource`.
 */
export async function fetchOAuthProtectedResourceMetadata(
  pdsOrigin: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ authorizationServers: string[]; resource?: string }> {
  const base = trimOrigin(pdsOrigin);
  const url = `${base}/.well-known/oauth-protected-resource`;
  const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`oauth-protected-resource failed: ${res.status} ${text.slice(0, 200)}`);
  }
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      `oauth-protected-resource: invalid JSON (HTTP ${res.status}) ${text.slice(0, 200)}`
    );
  }
  const raw = j.authorization_servers ?? j.authorizationServers;
  const authorizationServers: string[] = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === 'string').map(trimOrigin)
    : [];
  if (authorizationServers.length === 0) {
    throw new Error('oauth-protected-resource: no authorization_servers');
  }
  const resource = typeof j.resource === 'string' ? j.resource : undefined;
  return { authorizationServers, resource };
}
