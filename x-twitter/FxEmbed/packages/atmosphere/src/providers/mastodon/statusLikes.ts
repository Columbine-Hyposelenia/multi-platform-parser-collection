import type { APIUserListResults, APIUser } from '../../types/api-schemas.js';
import { assertSafeMastodonDomain, fetchFavouritedBy, nextMaxIdFromLinkHeader } from './client.js';
import { mastodonAccountToApiUser } from './processor.js';

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

const empty = (code: 404 | 500): APIUserListResults => ({
  code,
  results: [],
  cursor: { top: null, bottom: null }
});

export const mastodonStatusLikesAPI = async (
  id: string,
  domain: string,
  options: { count: number; cursor: string | null }
): Promise<APIUserListResults> => {
  try {
    assertSafeMastodonDomain(domain);
  } catch {
    return { code: 400, results: [], cursor: { top: null, bottom: null } };
  }

  const maxId = decodeCursorMaxId(options.cursor);
  const result = await fetchFavouritedBy(domain, id, {
    limit: options.count,
    max_id: maxId
  });

  if (!result.ok) {
    if (result.status === 401) {
      return { code: 401, results: [], cursor: { top: null, bottom: null } };
    }
    if (result.status === 404 || result.status === 400) {
      return empty(404);
    }
    return empty(500);
  }

  const accounts = result.data ?? [];
  const nextMax = nextMaxIdFromLinkHeader(result.link);
  const bottom = nextMax && accounts.length > 0 ? encodeCursorMaxId(nextMax) : null;

  const results: APIUser[] = accounts.map(a => mastodonAccountToApiUser(a, domain));

  return {
    code: 200,
    results,
    cursor: { top: null, bottom }
  };
};
