import type { APIUserListResults } from '../../types/api-schemas.js';
import { fetchGetLikes, fetchProfilesDetailedBatched } from './client.js';
import { blueskyProfileToApiUser } from './profile.js';
import { blueskyProfileViewToApiUser } from './profileFollowers.js';
import { atUriForFeedPost } from './uris.js';

const userListNotFound = (): APIUserListResults => ({
  code: 404,
  results: [],
  cursor: { top: null, bottom: null }
});

const userListUpstreamError = (): APIUserListResults => ({
  code: 500,
  results: [],
  cursor: { top: null, bottom: null }
});

export const blueskyStatusLikesAPI = async (
  handle: string,
  rkey: string,
  options: { count: number; cursor: string | null },
  opts?: { credentialKey?: string }
): Promise<APIUserListResults> => {
  const fetchOpts = { credentialKey: opts?.credentialKey };
  const uri = atUriForFeedPost(handle, rkey);
  const result = await fetchGetLikes(
    {
      uri,
      limit: options.count,
      cursor: options.cursor ?? undefined
    },
    fetchOpts
  );

  if (!result.ok) {
    if (result.status === 400 || result.status === 404) {
      return userListNotFound();
    }
    return userListUpstreamError();
  }

  const likes = result.data.likes ?? [];
  const nextCursor = result.data.cursor ?? null;

  const dids = likes.map(l => l.actor.did);
  const detailedByDid = await fetchProfilesDetailedBatched(dids, fetchOpts);

  const results = likes.map(l => {
    const detailed = detailedByDid.get(l.actor.did);
    if (detailed?.handle) {
      return blueskyProfileToApiUser(detailed);
    }
    return blueskyProfileViewToApiUser(l.actor);
  });

  return {
    code: 200,
    results,
    cursor: { top: null, bottom: nextCursor }
  };
};
