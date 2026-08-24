import type { AuthProvider } from './auth-provider.js';
import type { AtmosphereSocialProvider } from '../types/social-provider.js';
import type { BlueskyProxyCredentials } from '../types/proxy-credentials.js';

/**
 * - **public** — unauthenticated (AppView / public HTTP).
 * - **anonymous-proxy** — use operator-provided proxy accounts (e.g. PDS + app password on worker).
 * - **proxy-relay** — call another FxEmbed `/2` host (e.g. api.fxtwitter.com) with optional API key.
 * - **authenticated** — user or app OAuth (see {@link AuthProvider}).
 */
export type AtmosphereTransport<P extends AtmosphereSocialProvider> =
  | { kind: 'public' }
  | {
      kind: 'anonymous-proxy';
      /**
       * Bluesky: shuffled list of PDS accounts for XRPC proxy fallback.
       * Twitter / others: use provider-specific fields when added to the package.
       */
      bluesky?: { accounts: BlueskyProxyCredentials[]; credentialKey?: string };
    }
  | {
      kind: 'proxy-relay';
      baseUrl: string;
      userAgent: string;
      /** Optional for hosted relay APIs that require a key */
      apiKey?: string;
    }
  | { kind: 'authenticated'; auth: AuthProvider<P> };
