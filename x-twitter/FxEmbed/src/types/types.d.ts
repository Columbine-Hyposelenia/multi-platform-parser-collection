/* This file contains types relevant to FxEmbed and the FxTwitter API.
   Shared API field shapes (including APITwitterStatus) are derived from Zod in @fxembed/atmosphere (api-schemas).
   For Twitter GraphQL types, see packages/atmosphere/src/raw/vendor/twitter.d.ts */

import type { Context } from 'hono';

export type InputFlags = {
  standard?: boolean;
  direct?: boolean;
  api?: boolean;
  textOnly?: boolean;
  isXDomain?: boolean;
  forceInstantView?: boolean;
  instantViewUnrollThreads?: boolean;
  archive?: boolean;
  gallery?: boolean;
  forceMosaic?: boolean;
  name?: string;
  noActivity?: boolean;
  /** Set when `?horizon` is present; public links use Constants.HORIZON_WEB_ROOT (apap.fxtwitter.com) */
  horizon?: boolean;
};

declare global {
  interface StatusResponse {
    text?: string;
    response?: Response;
    cacheControl?: string | null;
  }

  interface ResponseInstructions {
    addHeaders: string[];
    authorText?: string;
    siteName?: string;
    engagementText?: string;
    text?: string;
  }

  interface RenderProperties {
    context: Context;
    status: APIStatus;
    thread?: SocialThread;
    siteText?: string;
    authorText?: string;
    engagementText?: string;
    isOverrideMedia?: boolean;
    userAgent?: string;
    text?: string;
    flags?: InputFlags;
    targetLanguage?: string;
  }

  interface TweetAPIResponse {
    code: number;
    message: string;
    tweet?: APITwitterStatus;
  }

  interface StatusAPIResponse {
    code: number;
    message: string;
    status?: APITwitterStatus;
  }

  type APIUser = import('@fxembed/atmosphere/types/api-schemas').APIUser;
  type APIFacet = import('@fxembed/atmosphere/types/api-schemas').APIFacet;
  type APITranslate = import('@fxembed/atmosphere/types/api-schemas').APITranslate;
  type APIExternalMedia = import('@fxembed/atmosphere/types/api-schemas').APIExternalMedia;
  type APIBroadcast = import('@fxembed/atmosphere/types/api-schemas').APIBroadcast;
  type APIPollChoice = import('@fxembed/atmosphere/types/api-schemas').APIPollChoice;
  type APIPoll = import('@fxembed/atmosphere/types/api-schemas').APIPoll;
  type APIMedia = import('@fxembed/atmosphere/types/api-schemas').APIMedia;
  type APIPhoto = import('@fxembed/atmosphere/types/api-schemas').APIPhoto;
  type APIVideo = import('@fxembed/atmosphere/types/api-schemas').APIVideo;
  type APIVideoFormat = import('@fxembed/atmosphere/types/api-schemas').APIVideoFormat;
  type APIMosaicPhoto = import('@fxembed/atmosphere/types/api-schemas').APIMosaicPhoto;
  type APITwitterCommunity = import('@fxembed/atmosphere/types/api-schemas').APITwitterCommunity;
  type UserAPIResponse = import('@fxembed/atmosphere/types/api-schemas').UserAPIResponse;
  type APISearchResults = import('@fxembed/atmosphere/types/api-schemas').APISearchResults;
  type APIUserListResults = import('@fxembed/atmosphere/types/api-schemas').APIUserListResults;
  type APITrendGroupedTopic = import('@fxembed/atmosphere/types/api-schemas').APITrendGroupedTopic;
  type APITrend = import('@fxembed/atmosphere/types/api-schemas').APITrend;
  type APITrendsResponse = import('@fxembed/atmosphere/types/api-schemas').APITrendsResponse;

  type APIStatus = import('@fxembed/atmosphere/types/api-status').APIStatus;
  type APITwitterStatus = import('@fxembed/atmosphere/types/api-schemas').APITwitterStatus;
  type APIBlueskyStatus = import('@fxembed/atmosphere/types/api-schemas').APIBlueskyStatus;
  type APITikTokStatus = import('@fxembed/atmosphere/types/api-status').APITikTokStatus;
  type APITwitterCommunityNote =
    import('@fxembed/atmosphere/types/api-schemas').APITwitterCommunityNote;
  type SocialPost = import('@fxembed/atmosphere/types/api-status').SocialPost;
  type SocialThread = import('@fxembed/atmosphere/types/api-status').SocialThread;
  type SocialConversation = import('@fxembed/atmosphere/types/api-status').SocialConversation;

  interface FetchResults {
    status: number;
  }

  interface OEmbed {
    author_name?: string;
    author_url?: string;
    provider_name?: string;
    provider_url?: string;
    title?: string | null;
    type: 'link' | 'rich';
    version: '1.0';
  }

  // Mastodon API V1 Interfaces
  interface ActivityStatus {
    id: string;
    url: string;
    uri: string;
    created_at: string;
    edited_at: string | null;
    reblog: null;
    in_reply_to_id: string | undefined | null;
    in_reply_to_account_id: string | undefined | null;
    language: string | undefined | null;
    content: string;
    spoiler_text: string;
    visibility: 'public';
    application: {
      name: string | null;
      website: string | null;
    };
    media_attachments: ActivityMediaAttachment[];
    account: ActivityAccount;
    mentions: [];
    tags: [];
    emojis: [];
    card: null;
    poll: null;
  }

  interface ActivityAccount {
    id: string;
    display_name: string;
    username: string;
    acct: string;
    url: string;
    uri: string;
    created_at: string;
    locked: boolean;
    bot: boolean;
    discoverable: boolean;
    indexable: boolean;
    group: boolean;
    avatar: string | undefined;
    avatar_static: string | undefined;
    header: string | undefined;
    header_static: string | undefined;
    followers_count: number | undefined;
    following_count: number | undefined;
    statuses_count: number | undefined;
    hide_collections: boolean;
    noindex: boolean;
    emojis: [];
    roles: [];
    fields: [];
  }

  interface ActivityMediaAttachment {
    id: string;
    type: 'image' | 'video' | 'gifv' | 'audio' | string;
    url: string;
    preview_url: string | null;
    remote_url: string | null;
    preview_remote_url: string | null;
    text_url: string | null;
    description: string | null;
    meta: {
      original?: {
        width: number;
        height: number;
        size?: string;
        aspect?: number;
      };
      small?: {
        width: number;
        height: number;
        size?: string;
        aspect?: number;
      };
    };
  }

  type CFAITranslation = {
    translated_text: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  type PolyglotTranslation = {
    translated_text: string;
    provider: string;
    source_lang: string;
    target_lang: string;
  };

  type GrokTranslation = {
    result: {
      content_type: 'POST';
      text: string;
      entities: {
        [key: string]: string;
      };
    };
  };
}

export {};
