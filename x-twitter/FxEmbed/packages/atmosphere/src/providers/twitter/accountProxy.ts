import { getTwitterProxyRuntime } from '../twitter-runtime.js';

/** Env shape for in-process X account proxy (tests may still use optional TwitterProxy Fetcher). */
export type TwitterAccountProxyEnv = {
  TwitterProxy?: { fetch: typeof fetch };
  CREDENTIAL_KEY?: string;
};

export function hasTwitterAccountProxy(env: TwitterAccountProxyEnv | undefined): boolean {
  return (
    typeof env?.TwitterProxy !== 'undefined' ||
    Boolean(
      env?.CREDENTIAL_KEY?.trim() && getTwitterProxyRuntime().hasBundledEncryptedCredentials()
    )
  );
}
