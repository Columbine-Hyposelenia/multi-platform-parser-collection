import type { APITrend, APITrendsResponse } from '../../types/api-schemas.js';
import { fetchTrendingTopics } from './client.js';
import type { BlueskyFetchOpts } from './client.js';

export type BlueskyTrendsFeedKind = 'trending' | 'suggested';

export const BLUESKY_TRENDS_FEED_KINDS: BlueskyTrendsFeedKind[] = ['trending', 'suggested'];

const BS_APP_ORIGIN = 'https://bsky.app';

function topicLinkAsContext(link: string | undefined): string | null {
  if (!link || typeof link !== 'string') {
    return null;
  }
  const path = link.startsWith('/') ? link : `/${link}`;
  return `${BS_APP_ORIGIN}${path}`;
}

function buildContext(linkContext: string | null, label: string | null): string | null {
  if (label && linkContext) {
    return `${label} · ${linkContext}`;
  }
  return label ?? linkContext;
}

function rowToApiTrend(
  row: BlueskyTrendingTopicRow,
  oneBasedRank: number,
  contextLabel: string | null
): APITrend | null {
  const name = row.topic;
  if (!name || typeof name !== 'string') {
    return null;
  }
  return {
    name,
    rank: String(oneBasedRank),
    context: buildContext(topicLinkAsContext(row.link), contextLabel)
  };
}

/**
 * Trending topic labels from Bluesky `app.bsky.unspecced.getTrendingTopics`.
 * `type=trending` returns live topics first, then fills from suggested feeds up to `count`.
 * `type=suggested` returns only the suggested list.
 */
export const blueskyTrendsAPI = async (
  kind: BlueskyTrendsFeedKind,
  count: number,
  fetchOpts?: BlueskyFetchOpts
): Promise<APITrendsResponse> => {
  const cappedCount = Math.min(50, Math.max(1, count));
  const upstreamLimit = Math.min(25, Math.max(1, cappedCount));

  const result = await fetchTrendingTopics(
    { limit: upstreamLimit },
    { credentialKey: fetchOpts?.credentialKey }
  );
  if (!result.ok) {
    return {
      code: result.status === 404 ? 404 : 500,
      timeline_type: kind,
      trends: [],
      cursor: { top: null, bottom: null },
      message:
        result.status === 404
          ? 'Trending topics unavailable'
          : 'Failed to load trending topics from Bluesky'
    };
  }

  const safeTopics = Array.isArray(result.data.topics) ? result.data.topics : [];
  const safeSuggested = Array.isArray(result.data.suggested) ? result.data.suggested : [];

  const trends: APITrend[] = [];

  if (kind === 'suggested') {
    let rank = 0;
    for (const row of safeSuggested) {
      const t = rowToApiTrend(row, rank + 1, 'Suggested feed');
      if (t) {
        trends.push(t);
        rank += 1;
        if (rank >= cappedCount) break;
      }
    }
  } else {
    let rank = 0;
    for (const row of safeTopics) {
      const t = rowToApiTrend(row, rank + 1, null);
      if (t) {
        trends.push(t);
        rank += 1;
        if (rank >= cappedCount) break;
      }
    }
    for (const row of safeSuggested) {
      if (rank >= cappedCount) break;
      const t = rowToApiTrend(row, rank + 1, 'Suggested feed');
      if (t) {
        trends.push(t);
        rank += 1;
      }
    }
  }

  if (!trends.length) {
    return {
      code: 404,
      timeline_type: kind,
      trends: [],
      cursor: { top: null, bottom: null },
      message: 'No trending topics in upstream response'
    };
  }

  return {
    code: 200,
    timeline_type: kind,
    trends,
    cursor: { top: null, bottom: null }
  };
};
