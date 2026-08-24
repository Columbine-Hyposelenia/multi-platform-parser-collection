import type { AuthProvider } from '../../../transports/auth-provider.js';
import { dpopAthFromAccessToken, signDpopProof } from './dpop.js';
import type { BlueskyAuthSession } from './types.js';
import { refreshBlueskyTokens } from './tokens.js';

/**
 * Optional bridge from a persisted {@link BlueskyAuthSession} to {@link AuthProvider}.
 * **Limitation:** DPoP `ath` and `htu` are derived from each request; `dpopNonce` rotation is not
 * applied automatically — prefer {@link authenticatedXrpc} for full Bluesky OAuth semantics.
 */
export function blueskyAuthSessionToAuthProvider(
  getSession: () => BlueskyAuthSession,
  setSession?: (s: BlueskyAuthSession) => void
): AuthProvider<'bluesky'> {
  return {
    provider: 'bluesky',
    async getAuthHeadersForRequest(req: { method: string; url: string; body?: unknown }) {
      const session = getSession();
      const u = new URL(req.url);
      const htu = `${u.origin}${u.pathname}`;
      const proof = await signDpopProof({
        keypair: session.dpop,
        htm: req.method,
        htu,
        nonce: session.dpopNonce,
        ath: await dpopAthFromAccessToken(session.accessToken)
      });
      return {
        Authorization: `DPoP ${session.accessToken}`,
        DPoP: proof
      };
    },
    refresh: setSession
      ? async () => {
          const next = await refreshBlueskyTokens({ session: getSession() });
          setSession(next);
        }
      : undefined
  };
}
