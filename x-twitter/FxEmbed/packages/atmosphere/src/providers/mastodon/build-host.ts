import type { APIStatus } from '../../types/api-status.js';

export type PolyglotLikeTranslation = {
  translated_text?: string;
  source_lang?: string;
  provider?: string;
};

/**
 * i18n / translation hooks from the worker (Hono) into Mastodon post building.
 */
export type MastodonBuildHost = {
  credentialKey?: string;
  aiEnabled?: boolean;
  t: (key: string, options?: { lng?: string; [k: string]: unknown }) => string;
  translatePolyglot?: (
    status: APIStatus,
    targetLang: string
  ) => Promise<PolyglotLikeTranslation | null>;
  translateAI?: (status: APIStatus, targetLang: string) => Promise<PolyglotLikeTranslation | null>;
};
