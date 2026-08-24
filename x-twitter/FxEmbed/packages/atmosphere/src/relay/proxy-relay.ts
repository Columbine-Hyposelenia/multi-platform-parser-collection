/**
 * Typed relay over another FxEmbed host’s `/2` JSON API (proxy-relay transport).
 * Prefer generating path types with `npm run openapi:atmosphere` at the repo root,
 * then wrapping calls with `openapi-fetch` against {@link createRelayFetch}.
 */

export type RelayFetchOptions = {
  baseUrl: string;
  userAgent: string;
  apiKey?: string;
};

/** Returns a `fetch`-compatible function that prefixes `baseUrl` and adds UA / optional API key. */
export function createRelayFetch(opts: RelayFetchOptions): typeof fetch {
  const base = opts.baseUrl.replace(/\/$/, '');
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const target = url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    const headers = new Headers(init?.headers);
    headers.set('User-Agent', opts.userAgent);
    if (opts.apiKey) headers.set('Authorization', `Bearer ${opts.apiKey}`);
    return fetch(target, { ...init, headers });
  };
}
