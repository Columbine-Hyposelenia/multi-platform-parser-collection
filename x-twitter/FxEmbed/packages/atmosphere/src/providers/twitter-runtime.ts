import type { TwitterCredentials } from '../types/proxy-credentials.js';

/**
 * Twitter / X web/API configuration. The FxEmbed worker calls {@link setTwitterProviderEnv} at startup.
 */
export type TwitterProviderEnv = {
  apiRoot: string;
  webRoot: string;
  friendlyUserAgent: string;
  guestBearerToken: string;
  baseHeaders: Record<string, string>;
  guestTokenMaxAge: number;
  mosaicDomainList: string[];
  /** Bluesky mosaics when used from shared helpers */
  mosaicBskyDomainList: string[];
  polyglotDomainList: string[];
  apiHostList: string[];
  videoBase: string;
  gifTranscodeDomainList: string[];
  oldEmbedDomains: string[];
  blueskyApiHostList: string[];
};

const defaultEnv: TwitterProviderEnv = {
  apiRoot: 'https://api.x.com',
  webRoot: 'https://x.com',
  friendlyUserAgent: 'FxEmbed',
  guestBearerToken: '',
  baseHeaders: {},
  guestTokenMaxAge: 3600,
  mosaicDomainList: [],
  mosaicBskyDomainList: [],
  polyglotDomainList: [],
  apiHostList: [],
  videoBase: 'https://video.twimg.com',
  gifTranscodeDomainList: [],
  oldEmbedDomains: [],
  blueskyApiHostList: []
};

let env: TwitterProviderEnv = { ...defaultEnv };

export function setTwitterProviderEnv(partial: Partial<TwitterProviderEnv>): void {
  env = { ...env, ...partial };
}

export function getTwitterProviderEnv(): TwitterProviderEnv {
  return env;
}

/**
 * Encrypted bundle decrypt + account selection lives in the worker; the package only sees this interface
 * (see `setBlueskyProxyRuntime` in bluesky-runtime.ts).
 */
export type TwitterProxyRuntime = {
  initCredentials: (key: string | undefined) => Promise<void>;
  hasBundledEncryptedCredentials: () => boolean;
  hasDecryptedCredentials: () => boolean;
  getRandomTwitterAccount: () => TwitterCredentials;
};

let twitterProxy: TwitterProxyRuntime | null = null;

export function setTwitterProxyRuntime(r: TwitterProxyRuntime): void {
  twitterProxy = r;
}

export function getTwitterProxyRuntime(): TwitterProxyRuntime {
  if (!twitterProxy) {
    throw new Error(
      'Twitter proxy runtime not configured: call setTwitterProxyRuntime() from the FxEmbed worker (see worker.ts)'
    );
  }
  return twitterProxy;
}
