import type {
  APIBlueskyNotification,
  APIBlueskyNotificationReason,
  APIBlueskyStatus,
  APIUser
} from '../../types/api-schemas.js';
import { getBlueskyProviderEnv } from '../bluesky-runtime.js';
import { blueskyVerificationToApiUserVerification } from './verification.js';
import type { BlueskyAuthSession } from './auth/types.js';
import { authenticatedXrpc } from './auth/xrpc-authenticated.js';
import type { BlueskyBuildHost } from './build-host.js';
import { buildAPIBlueskyPost } from './processor.js';

const GET_POSTS_MAX = 25;

function apiUserFromAuthor(author: BlueskyAuthor): APIUser {
  const base: APIUser = {
    id: author.handle,
    name: author.displayName || author.handle,
    screen_name: author.handle,
    avatar_url: author.avatar ?? null,
    banner_url: null,
    description: '',
    raw_description: { text: '', facets: [] },
    location: '',
    followers: 0,
    following: 0,
    media_count: 0,
    likes: 0,
    url: `${getBlueskyProviderEnv().webRoot}/profile/${author.handle}`,
    protected: false,
    statuses: 0,
    joined: author.createdAt,
    birthday: { day: 0, month: 0, year: 0 },
    website: null,
    profile_embed: true,
    type: 'profile'
  };
  const v = blueskyVerificationToApiUserVerification(author.verification);
  if (v) base.verification = v;
  return base;
}

function mapReasonType($type: string | undefined): APIBlueskyNotificationReason {
  if (!$type) return 'unknown';
  const t = $type.toLowerCase();
  if (t.includes('like')) return 'like';
  if (t.includes('repost') || t.includes('reasonrepost')) return 'repost';
  if (t.includes('follow')) return 'follow';
  if (t.includes('mention')) return 'mention';
  if (t.includes('reply')) return 'reply';
  if (t.includes('quote')) return 'quote';
  if (t.includes('starterpack')) return 'starterpack-joined';
  if (t.includes('verified')) return 'verified';
  if (t.includes('unverified')) return 'unverified';
  return 'unknown';
}

function subjectUriFromReason(reason: Record<string, unknown>): string | undefined {
  const s = reason.subject;
  if (typeof s === 'string' && s.startsWith('at://')) return s;
  const like = reason.like;
  if (typeof like === 'string' && like.startsWith('at://')) return like;
  const repost = reason.repost;
  if (typeof repost === 'string' && repost.startsWith('at://')) return repost;
  return undefined;
}

function needsPostHydration(reason: APIBlueskyNotificationReason): boolean {
  return (
    reason === 'like' ||
    reason === 'repost' ||
    reason === 'reply' ||
    reason === 'quote' ||
    reason === 'mention'
  );
}

export type ListNotificationsRow = {
  uri?: string;
  cid?: string;
  author?: BlueskyAuthor;
  reason?: Record<string, unknown> & { $type?: string };
  record?: Record<string, unknown>;
  indexedAt?: string;
  isRead?: boolean;
};

export async function buildBlueskyNotificationsPage(params: {
  session: BlueskyAuthSession;
  host: BlueskyBuildHost;
  rows: ListNotificationsRow[];
  language?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ notifications: APIBlueskyNotification[]; session: BlueskyAuthSession }> {
  let session = params.session;
  const uris = new Set<string>();
  const pending: {
    row: ListNotificationsRow;
    reason: APIBlueskyNotificationReason;
    subject?: string;
  }[] = [];

  for (const row of params.rows) {
    const reasonObj = (row.reason ?? {}) as Record<string, unknown> & { $type?: string };
    const reason = mapReasonType(reasonObj.$type);
    const reasonSubject = subjectUriFromReason(reasonObj);
    if (needsPostHydration(reason) && reasonSubject?.includes('/app.bsky.feed.post/')) {
      uris.add(reasonSubject);
    }
    pending.push({ row, reason, subject: reasonSubject });
  }

  const postByUri = new Map<string, BlueskyPost>();
  const uriList = [...uris];
  for (let i = 0; i < uriList.length; i += GET_POSTS_MAX) {
    const chunk = uriList.slice(i, i + GET_POSTS_MAX);
    if (chunk.length === 0) continue;
    const { data, session: next } = await authenticatedXrpc<{ posts?: BlueskyPost[] }>({
      session,
      lexiconMethod: 'app.bsky.feed.getPosts',
      method: 'GET',
      query: { uris: chunk },
      fetchImpl: params.fetchImpl
    });
    session = next;
    for (const p of data.posts ?? []) {
      if (p?.uri) postByUri.set(p.uri, p);
    }
  }

  const notifications: APIBlueskyNotification[] = [];
  for (const { row, reason, subject } of pending) {
    const author = row.author;
    if (!author?.handle || !row.cid || !row.uri) continue;
    const created = row.indexedAt ?? '';
    const createdTs = created ? Date.parse(created) / 1000 : 0;
    const subjectPost = subject && needsPostHydration(reason) ? postByUri.get(subject) : undefined;
    let subject_status: APIBlueskyNotification['subject_status'];
    if (subjectPost) {
      try {
        subject_status = (await buildAPIBlueskyPost(
          params.host,
          subjectPost,
          params.language
        )) as APIBlueskyStatus;
      } catch {
        subject_status = undefined;
      }
    }
    notifications.push({
      id: row.cid,
      at_uri: row.uri,
      reason,
      ...(subject ? { reason_subject: subject } : {}),
      actor: apiUserFromAuthor(author),
      is_read: Boolean(row.isRead),
      created_at: created,
      created_timestamp: Number.isFinite(createdTs) ? createdTs : 0,
      ...(subject_status ? { subject_status } : {})
    });
  }

  return { notifications, session };
}
