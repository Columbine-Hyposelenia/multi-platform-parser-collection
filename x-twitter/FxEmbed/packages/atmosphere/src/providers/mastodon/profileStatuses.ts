import type { APIMastodonStatus, APISearchResultsMastodon } from '../../types/api-schemas.js';
import {
  assertSafeMastodonDomain,
  fetchAccountStatuses,
  lookupAccount,
  nextMaxIdFromLinkHeader
} from './client.js';
import { buildAPIMastodonPost } from './processor.js';
import type { MastodonBuildHost } from './build-host.js';

const decodeCursorMaxId = (cursor: string | null): string | undefined => {
  if (!cursor) return undefined;
  try {
    let b64 = cursor.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const o = JSON.parse(atob(b64)) as { v?: number; max_id?: string };
    if (o.v !== 1 || typeof o.max_id !== 'string') return undefined;
    return o.max_id;
  } catch {
    return undefined;
  }
};

const encodeCursorMaxId = (maxId: string): string => {
  const json = JSON.stringify({ v: 1, max_id: maxId });
  const b64 = btoa(json);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const unixTimestampParamToMs = (unix: number): number =>
  unix >= 1_000_000_000_000 ? unix : unix * 1000;

export const mastodonProfileStatusesAPI = async (
  username: string,
  domain: string,
  options: {
    count: number;
    cursor: string | null;
    withReplies: boolean;
    language?: string;
    since?: number;
  },
  host: MastodonBuildHost
): Promise<APISearchResultsMastodon | { noContent: true }> => {
  try {
    assertSafeMastodonDomain(domain);
  } catch {
    return { code: 400, results: [], cursor: { top: null, bottom: null } };
  }

  const acct = username.includes('@')
    ? username
    : `${username}@${assertSafeMastodonDomain(domain)}`;
  const looked = await lookupAccount(domain, acct);
  if (!looked.ok || !looked.data?.id) {
    return { code: 404, results: [], cursor: { top: null, bottom: null } };
  }

  const maxId = decodeCursorMaxId(options.cursor);
  const result = await fetchAccountStatuses(domain, looked.data.id, {
    limit: options.count,
    max_id: maxId,
    exclude_replies: !options.withReplies
  });

  if (!result.ok) {
    if (result.status === 404 || result.status === 400) {
      return { code: 404, results: [], cursor: { top: null, bottom: null } };
    }
    return { code: 500, results: [], cursor: { top: null, bottom: null } };
  }

  const statuses = result.data ?? [];
  const nextMax = nextMaxIdFromLinkHeader(result.link);
  const bottom = nextMax && statuses.length > 0 ? encodeCursorMaxId(nextMax) : null;

  const built = await Promise.all(
    statuses.map(async raw => {
      try {
        return (await buildAPIMastodonPost(
          host,
          raw,
          domain,
          options.language
        )) as APIMastodonStatus;
      } catch (e) {
        console.error('mastodon profile status build', e);
        return null;
      }
    })
  );

  const results = built.filter((s): s is APIMastodonStatus => s !== null);

  if (options.since !== undefined && !options.cursor) {
    const sinceMs = unixTimestampParamToMs(options.since);
    const hasNewer = results.some(s => {
      const tMs = s.created_timestamp * 1000;
      return Number.isFinite(tMs) && tMs > sinceMs;
    });
    if (!hasNewer) {
      return { noContent: true };
    }
  }

  return {
    code: 200,
    results,
    cursor: { top: null, bottom }
  };
};

export const mastodonProfileMediaAPI = async (
  username: string,
  domain: string,
  options: { count: number; cursor: string | null; language?: string },
  host: MastodonBuildHost
): Promise<APISearchResultsMastodon> => {
  try {
    assertSafeMastodonDomain(domain);
  } catch {
    return { code: 400, results: [], cursor: { top: null, bottom: null } };
  }

  const acct = username.includes('@')
    ? username
    : `${username}@${assertSafeMastodonDomain(domain)}`;
  const looked = await lookupAccount(domain, acct);
  if (!looked.ok || !looked.data?.id) {
    return { code: 404, results: [], cursor: { top: null, bottom: null } };
  }

  const maxId = decodeCursorMaxId(options.cursor);
  const result = await fetchAccountStatuses(domain, looked.data.id, {
    limit: options.count,
    max_id: maxId,
    only_media: true,
    exclude_replies: true
  });

  if (!result.ok) {
    if (result.status === 404 || result.status === 400) {
      return { code: 404, results: [], cursor: { top: null, bottom: null } };
    }
    return { code: 500, results: [], cursor: { top: null, bottom: null } };
  }

  const statuses = result.data ?? [];
  const nextMax = nextMaxIdFromLinkHeader(result.link);
  const bottom = nextMax && statuses.length > 0 ? encodeCursorMaxId(nextMax) : null;

  const built = await Promise.all(
    statuses.map(async raw => {
      try {
        return (await buildAPIMastodonPost(
          host,
          raw,
          domain,
          options.language
        )) as APIMastodonStatus;
      } catch (e) {
        console.error('mastodon profile media build', e);
        return null;
      }
    })
  );

  return {
    code: 200,
    results: built.filter((s): s is APIMastodonStatus => s !== null),
    cursor: { top: null, bottom }
  };
};
