import type { AtmosphereTransport } from './atmosphere-transport.js';
import type { AtmosphereSocialProvider } from '../types/social-provider.js';

/** Optional Cache API–like adapter (Workers Cache, in-memory, etc.) */
export type CacheAdapter = {
  match: (key: Request) => Promise<Response | undefined>;
  put: (key: Request, res: Response) => Promise<void>;
};

export type Logger = {
  debug?: (msg: string, ...args: unknown[]) => void;
  info?: (msg: string, ...args: unknown[]) => void;
  warn?: (msg: string, ...args: unknown[]) => void;
  error?: (msg: string, ...args: unknown[]) => void;
};

/**
 * i18n hook for providers that emit user-facing strings in processors.
 * Defaults to no-op in the package; FxEmbed injects i18next from the worker.
 */
export type Translate = (
  key: string,
  options?: Record<string, string | number | boolean>
) => string;

/** Base options for provider clients (Bluesky, Twitter, …). */
export type ProviderClientOptions<P extends AtmosphereSocialProvider> = {
  transport: AtmosphereTransport<P>;
  /** Tried in order if the primary transport fails in a retriable way. */
  fallbacks?: AtmosphereTransport<P>[];
  fetch: typeof fetch;
  userAgent: string;
  cache?: CacheAdapter;
  logger?: Logger;
  t?: Translate;
};
