import type { APIBlueskyNotificationsResults } from '../../types/api-schemas.js';
import type { BlueskyAuthSession } from './auth/types.js';
import { authenticatedXrpc } from './auth/xrpc-authenticated.js';
import type { BlueskyBuildHost } from './build-host.js';
import {
  buildBlueskyNotificationsPage,
  type ListNotificationsRow
} from './notifications-processor.js';

type ListNotificationsResponse = {
  notifications?: ListNotificationsRow[];
  cursor?: string;
  seenAt?: string;
};

/**
 * Authenticated notification list (`app.bsky.notification.listNotifications`).
 */
export async function fetchBlueskyNotifications(params: {
  session: BlueskyAuthSession;
  host: BlueskyBuildHost;
  limit?: number;
  cursor?: string | null;
  priority?: 'high' | 'low';
  reasons?: string[];
  seenAt?: string;
  language?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ response: APIBlueskyNotificationsResults; session: BlueskyAuthSession }> {
  const query: Record<string, string | number | boolean | undefined | string[]> = {
    limit: params.limit ?? 25,
    ...(params.cursor ? { cursor: params.cursor } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.seenAt ? { seenAt: params.seenAt } : {}),
    ...(params.reasons?.length ? { reasons: params.reasons } : {})
  };

  const { data, session } = await authenticatedXrpc<ListNotificationsResponse>({
    session: params.session,
    lexiconMethod: 'app.bsky.notification.listNotifications',
    method: 'GET',
    query,
    fetchImpl: params.fetchImpl
  });

  const { notifications, session: next } = await buildBlueskyNotificationsPage({
    session,
    host: params.host,
    rows: data.notifications ?? [],
    language: params.language,
    fetchImpl: params.fetchImpl
  });

  const response: APIBlueskyNotificationsResults = {
    code: 200,
    results: notifications,
    cursor: { top: null, bottom: data.cursor ?? null },
    ...(typeof data.seenAt === 'string' ? { seen_at: data.seenAt } : {})
  };
  return { response, session: next };
}

export async function getBlueskyNotificationUnreadCount(params: {
  session: BlueskyAuthSession;
  priority?: 'high' | 'low';
  seenAt?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ count: number; session: BlueskyAuthSession }> {
  const query: Record<string, string | number | boolean | undefined | string[]> = {
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.seenAt ? { seenAt: params.seenAt } : {})
  };
  const { data, session } = await authenticatedXrpc<{ count?: number }>({
    session: params.session,
    lexiconMethod: 'app.bsky.notification.getUnreadCount',
    method: 'GET',
    query,
    fetchImpl: params.fetchImpl
  });
  return { count: typeof data.count === 'number' ? data.count : 0, session };
}

export async function updateBlueskyNotificationSeen(params: {
  session: BlueskyAuthSession;
  seenAt: string;
  fetchImpl?: typeof fetch;
}): Promise<{ session: BlueskyAuthSession }> {
  const { session } = await authenticatedXrpc<Record<string, unknown>>({
    session: params.session,
    lexiconMethod: 'app.bsky.notification.updateSeen',
    method: 'POST',
    body: { seenAt: params.seenAt },
    fetchImpl: params.fetchImpl
  });
  return { session };
}
