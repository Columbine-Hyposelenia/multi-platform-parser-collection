import type {
  APIBlueskyStatus,
  APIInstagramStatus,
  APIMastodonStatus,
  APIThreadsStatus,
  APITombstoneReason,
  APITwitterStatus,
  APIStatusTombstone
} from '../types/api-schemas.js';
import type { APIStatus, SocialConversation, SocialThread } from '../types/api-status.js';

export function isTombstone(x: unknown): x is APIStatusTombstone {
  return typeof x === 'object' && x !== null && (x as APIStatusTombstone).type === 'tombstone';
}

const fallbackMessageEn = (reason: APITombstoneReason): string => {
  switch (reason) {
    case 'deleted':
      return 'This post is deleted';
    case 'suspended':
      return 'This post is from a suspended account';
    case 'private':
      return 'This post is from a private account';
    case 'blocked':
      return 'This post has been blocked from view by its author';
    case 'unavailable':
    default:
      return 'This post is unavailable';
  }
};

const tombstoneKey: Record<APITombstoneReason, string> = {
  deleted: 'tombstoneMessageDeleted',
  suspended: 'tombstoneMessageSuspended',
  private: 'tombstoneMessagePrivate',
  blocked: 'tombstoneMessageBlocked',
  unavailable: 'tombstoneMessageUnavailable'
};

/**
 * User-facing message for API `reason`.
 * Pass `t` for i18n (key per reason in `tombstoneKey`); otherwise English fallbacks.
 */
export const tombstoneMessageForReason = (
  reason: APITombstoneReason,
  t?: (key: string) => string
): string => {
  if (t) {
    const key = tombstoneKey[reason];
    const out = t(key);
    if (out && out !== key) {
      return out;
    }
  }
  return fallbackMessageEn(reason);
};

type Statusish =
  | APIStatus
  | APITwitterStatus
  | APIBlueskyStatus
  | APIMastodonStatus
  | APIInstagramStatus
  | APIThreadsStatus;

function stripQuotesDeep(s: Statusish): void {
  if (isTombstone(s)) return;
  const q = s.quote;
  if (!q) return;
  if (isTombstone(q)) {
    delete s.quote;
    return;
  }
  stripQuotesDeep(q as Statusish);
}

/** Remove tombstones from thread/replies and nested quotes (embed / API JSON). */
export function stripTombstones<T extends SocialThread | SocialConversation>(obj: T): T {
  if (obj.status && !isTombstone(obj.status)) {
    stripQuotesDeep(obj.status as Statusish);
  }
  if (obj.thread?.length) {
    for (const item of obj.thread) {
      if (!isTombstone(item)) stripQuotesDeep(item as Statusish);
    }
    (obj as SocialThread).thread = obj.thread.filter(s => !isTombstone(s)) as typeof obj.thread;
  }
  if ('replies' in obj && obj.replies?.length) {
    for (const item of obj.replies) {
      if (isTombstone(item)) continue;
      if (item.type === 'substatus') continue;
      stripQuotesDeep(item as Statusish);
    }
    (obj as SocialConversation).replies = obj.replies.filter(
      s => !isTombstone(s)
    ) as typeof obj.replies;
  }
  return obj;
}
