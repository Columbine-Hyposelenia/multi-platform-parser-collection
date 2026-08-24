import type { AtmosphereSocialProvider } from '../types/social-provider.js';

/**
 * Pluggable auth for the `authenticated` transport (OAuth, app passwords, etc.).
 * Horizon / future clients implement this; FxEmbed public worker does not ship an implementation yet.
 *
 * **Bluesky OAuth + DPoP:** token lifecycles, nonce rotation, and refresh-on-401 use the stateless
 * `BlueskyAuthSession` blob — pass it into `authenticatedXrpc` / `fetchBlueskyHomeFeed` / notification
 * helpers, then persist the returned `session`. Optional: `blueskyAuthSessionToAuthProvider` in
 * `providers/bluesky/auth/session-auth-provider.js` maps a session getter to `AuthProvider<'bluesky'>`
 * (limited DPoP nonce handling vs. `authenticatedXrpc`).
 */
export type AuthProvider<P extends AtmosphereSocialProvider> = {
  /** Provider key this auth applies to */
  readonly provider: P;
  getAuthHeadersForRequest(req: {
    method: string;
    url: string;
    body?: unknown;
  }): Promise<Record<string, string>>;
  /** Optional refresh (e.g. token rotation) */
  refresh?(): Promise<void>;
};
