import type { APIStatusTombstone, APITwitterStatus } from '../../types/api-schemas.js';

export type TwitterPolyglotLikeTranslation = {
  translated_text?: string;
  source_lang?: string;
  provider?: string;
};

/**
 * Per-request dependencies for Twitter: i18n, optional AI/polyglot, CF bindings, request metadata.
 */
export type TwitterBuildHost = {
  credentialKey?: string;
  aiEnabled?: boolean;
  t: (key: string, options?: { lng?: string; [k: string]: unknown }) => string;
  translatePolyglot?: (
    status: APITwitterStatus,
    targetLang: string
  ) => Promise<TwitterPolyglotLikeTranslation | null>;
  translateAI?: (
    status: APITwitterStatus,
    targetLang: string
  ) => Promise<TwitterPolyglotLikeTranslation | null>;
  /** Worker supplies i18n tombstone messages (see `src/helpers/tombstone.ts`). */
  withLocalizedTombstone?: (
    t: APIStatusTombstone,
    language: string | undefined
  ) => Promise<APIStatusTombstone>;
  twitterProxy?: { fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> };
  analyticsEngine?: { writeDataPoint: (data: unknown) => void };
  waitUntil?: (p: Promise<unknown> | unknown) => void;
  exceptionWebhookUrl?: string;
  request?: { url: string; userAgent?: string; cf?: unknown };
  /**
   * Gif transcode gating (worker uses experiments + host lists; same as former `shouldTranscodeGif(c)`).
   */
  shouldTranscodeGif?: () => boolean;
  /**
   * KITCHENSINK_gif experiment + Discord bot + `gif` query param.
   */
  useWebpInsteadOfGifForKitchensink?: () => boolean;
  /**
   * Experiment.BROADCAST_STREAM_API — card broadcast enrichment.
   */
  broadcastStreamApi?: boolean;
  /** Experiment.TWEET_DETAIL_API — GraphQL TweetDetail path. */
  tweetDetailApi?: boolean;
};
