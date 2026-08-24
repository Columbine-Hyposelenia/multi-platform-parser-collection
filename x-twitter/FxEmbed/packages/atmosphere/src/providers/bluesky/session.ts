import type { BlueskyProxyCredentials } from '../../types/proxy-credentials.js';

const SESSION_FETCH_TIMEOUT_MS = 8_000;

export type CachedBlueskySession = {
  accessJwt: string;
  refreshJwt: string;
  accessExpiresAtMs: number;
};

const sessionCache = new Map<string, CachedBlueskySession>();
const sessionInFlight = new Map<string, Promise<CachedBlueskySession | null>>();

function normalizeServiceBase(service: string): string {
  return service.replace(/\/$/, '');
}

export function blueskyProxyCacheKey(cred: BlueskyProxyCredentials): string {
  return `${normalizeServiceBase(cred.service)}\0${cred.identifier}`;
}

function parseJwtExpMs(jwt: string): number | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1] ?? '';
    const pad = '='.repeat((4 - (payload.length % 4)) % 4);
    const b64 = (payload + pad).replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(b64)) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function invalidateBlueskySession(cred: BlueskyProxyCredentials): void {
  sessionCache.delete(blueskyProxyCacheKey(cred));
}

async function createSession(cred: BlueskyProxyCredentials): Promise<CachedBlueskySession | null> {
  const base = normalizeServiceBase(cred.service);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), SESSION_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      signal: ac.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ identifier: cred.identifier, password: cred.appPassword })
    });
    const text = await res.text();
    if (!res.ok) return null;
    const j = JSON.parse(text) as { accessJwt?: string; refreshJwt?: string };
    if (!j.accessJwt || !j.refreshJwt) return null;
    const accessExpiresAtMs = parseJwtExpMs(j.accessJwt) ?? Date.now() + 120_000;
    return { accessJwt: j.accessJwt, refreshJwt: j.refreshJwt, accessExpiresAtMs };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function refreshSession(
  cred: BlueskyProxyCredentials,
  refreshJwt: string
): Promise<CachedBlueskySession | null> {
  const base = normalizeServiceBase(cred.service);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), SESSION_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/xrpc/com.atproto.server.refreshSession`, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        'Authorization': `Bearer ${refreshJwt}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const text = await res.text();
    if (!res.ok) return null;
    const j = JSON.parse(text) as { accessJwt?: string; refreshJwt?: string };
    if (!j.accessJwt || !j.refreshJwt) return null;
    const accessExpiresAtMs = parseJwtExpMs(j.accessJwt) ?? Date.now() + 120_000;
    return { accessJwt: j.accessJwt, refreshJwt: j.refreshJwt, accessExpiresAtMs };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Returns a valid access JWT for the proxy account, using cache + refresh + createSession.
 */
export async function getBlueskyAccessJwt(cred: BlueskyProxyCredentials): Promise<string | null> {
  const key = blueskyProxyCacheKey(cred);
  const cached = sessionCache.get(key);
  if (cached && cached.accessExpiresAtMs > Date.now() + 30_000) {
    return cached.accessJwt;
  }

  const pending = sessionInFlight.get(key);
  if (pending) {
    const s = await pending;
    return s?.accessJwt ?? null;
  }

  const promise = (async (): Promise<CachedBlueskySession | null> => {
    try {
      const cur = sessionCache.get(key);
      if (cur?.refreshJwt) {
        const refreshed = await refreshSession(cred, cur.refreshJwt);
        if (refreshed) {
          sessionCache.set(key, refreshed);
          return refreshed;
        }
      }
      const created = await createSession(cred);
      if (created) sessionCache.set(key, created);
      return created;
    } finally {
      sessionInFlight.delete(key);
    }
  })();

  sessionInFlight.set(key, promise);
  const result = await promise;
  return result?.accessJwt ?? null;
}
