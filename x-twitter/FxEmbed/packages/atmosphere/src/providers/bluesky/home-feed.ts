import type { APIBlueskyStatus, APISearchResultsBluesky } from '../../types/api-schemas.js';
import type { BlueskyAuthSession } from './auth/types.js';
import { authenticatedXrpc } from './auth/xrpc-authenticated.js';
import type { BlueskyBuildHost } from './build-host.js';
import { buildAPIBlueskyPost } from './processor.js';

type GetTimelineResponse = {
  feed?: BlueskyFeedViewPost[];
  cursor?: string;
};

/**
 * Authenticated home timeline (`app.bsky.feed.getTimeline`). Requires a valid {@link BlueskyAuthSession}.
 * Returns FxBluesky-style search results plus the updated session (persist `session` after every call).
 */
export async function fetchBlueskyHomeFeed(params: {
  session: BlueskyAuthSession;
  host: BlueskyBuildHost;
  limit?: number;
  cursor?: string | null;
  algorithm?: string;
  language?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ response: APISearchResultsBluesky; session: BlueskyAuthSession }> {
  const limit = params.limit ?? 30;
  const cursor = params.cursor ?? undefined;
  const query: Record<string, string | number | boolean | undefined | string[]> = {
    limit,
    ...(cursor ? { cursor } : {}),
    ...(params.algorithm ? { algorithm: params.algorithm } : {})
  };

  const { data, session } = await authenticatedXrpc<GetTimelineResponse>({
    session: params.session,
    lexiconMethod: 'app.bsky.feed.getTimeline',
    method: 'GET',
    query,
    fetchImpl: params.fetchImpl
  });

  const feed = data.feed ?? [];
  const results = (
    await Promise.all(
      feed.map(async item => {
        const post = item.post;
        if (!post?.uri || !post.cid) return null;
        try {
          return (await buildAPIBlueskyPost(
            params.host,
            post,
            params.language
          )) as APIBlueskyStatus;
        } catch (e) {
          console.error('fetchBlueskyHomeFeed: buildAPIBlueskyPost failed', e);
          return null;
        }
      })
    )
  ).filter((s): s is NonNullable<typeof s> => s !== null);

  const response: APISearchResultsBluesky = {
    code: 200,
    results,
    cursor: { top: null, bottom: data.cursor ?? null }
  };
  return { response, session };
}
