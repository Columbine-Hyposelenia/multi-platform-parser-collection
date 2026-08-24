/**
 * Mastodon HTTP defaults (User-Agent, mosaic / polyglot domain lists).
 * The FxEmbed worker should call {@link setMastodonProviderEnv} at startup (see `worker.ts`).
 */
export type MastodonProviderEnv = {
  userAgent: string;
  mosaicDomainList: string[];
  polyglotDomainList: string[];
};

const defaultEnv: MastodonProviderEnv = {
  userAgent: 'FxEmbed',
  mosaicDomainList: [],
  polyglotDomainList: []
};

let env: MastodonProviderEnv = { ...defaultEnv };

export function setMastodonProviderEnv(partial: Partial<MastodonProviderEnv>): void {
  env = { ...env, ...partial };
}

export function getMastodonProviderEnv(): MastodonProviderEnv {
  return env;
}
