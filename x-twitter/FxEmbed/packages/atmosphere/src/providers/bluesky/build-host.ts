import type { APIStatus } from '../../types/api-status.js';

/**
 * Translation / i18n / feature flags passed from the worker (Hono) or another host into Bluesky processing.
 * Keeps `@fxembed/atmosphere` free of Hono and i18next imports.
 */
export type PolyglotLikeTranslation = {
  translated_text?: string;
  source_lang?: string;
  provider?: string;
};

export type BlueskyBuildHost = {
  credentialKey?: string;
  aiEnabled?: boolean;
  t: (key: string, options?: { lng?: string; [k: string]: unknown }) => string;
  translatePolyglot?: (
    status: APIStatus,
    targetLang: string
  ) => Promise<PolyglotLikeTranslation | null>;
  translateAI?: (status: APIStatus, targetLang: string) => Promise<PolyglotLikeTranslation | null>;
};
