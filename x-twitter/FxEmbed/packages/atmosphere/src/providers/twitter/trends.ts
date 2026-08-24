/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExplorePageQuery } from './graphql/queries.js';
import { graphqlRequest } from './graphql/request.js';
import type { APITrend, APITrendsResponse } from '../../types/api-schemas.js';
import type { TwitterBuildHost } from './build-host.js';

export type PublicExploreTimelineKind = 'trending';

const EXPLORE_TIMELINE_SECTIONS: Record<PublicExploreTimelineKind, { exploreSectionId: string }> = {
  trending: { exploreSectionId: 'trending' }
};

export const PUBLIC_EXPLORE_TIMELINE_KINDS = Object.keys(
  EXPLORE_TIMELINE_SECTIONS
) as PublicExploreTimelineKind[];

function isGraphQLTimelineCursorLoose(obj: unknown): obj is { cursorType: string; value: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as { __typename?: string }).__typename === 'TimelineTimelineCursor' &&
    typeof (obj as { value?: string }).value === 'string'
  );
}

export function timelineTrendToApiTrend(raw: TimelineTrendRaw): APITrend | null {
  const name = raw.name;
  if (!name || typeof name !== 'string') {
    return null;
  }
  const grouped =
    raw.grouped_trends
      ?.map(g => ({
        name: typeof g.name === 'string' ? g.name : ''
      }))
      .filter(g => g.name) ?? [];

  const trend: APITrend = {
    name,
    rank: typeof raw.rank === 'string' ? raw.rank : null,
    context:
      typeof raw.trend_metadata?.domain_context === 'string'
        ? raw.trend_metadata.domain_context
        : null
  };

  if (grouped.length > 0) {
    trend.grouped_topics = grouped;
  }
  return trend;
}

function processTimelineItemContent(
  itemContent: unknown,
  trends: APITrend[],
  cursors: { cursorType: string; value: string }[]
): void {
  if (!itemContent || typeof itemContent !== 'object') {
    return;
  }
  const ic = itemContent as TimelineTrendRaw & { __typename?: string };
  if (ic.__typename === 'TimelineFrame') {
    return;
  }
  if (ic.__typename === 'TimelineTrend') {
    const parsed = timelineTrendToApiTrend(ic);
    if (parsed) {
      trends.push(parsed);
    }
    return;
  }
  if (isGraphQLTimelineCursorLoose(itemContent)) {
    cursors.push(itemContent);
  }
}

export function parseTrendsFromGenericTimelineInstructions(
  instructions: TimelineInstruction[] | undefined
): { trends: APITrend[]; cursors: { cursorType: string; value: string }[] } {
  const trends: APITrend[] = [];
  const cursors: { cursorType: string; value: string }[] = [];

  for (const inst of instructions ?? []) {
    if (inst.type !== 'TimelineAddEntries') {
      continue;
    }
    for (const entry of inst.entries ?? []) {
      const content = (entry as { content?: any }).content;
      if (!content || typeof content !== 'object') {
        continue;
      }

      if (isGraphQLTimelineCursorLoose(content)) {
        cursors.push(content);
        continue;
      }

      if (content.__typename === 'TimelineTimelineItem') {
        processTimelineItemContent(
          (content as { itemContent?: unknown }).itemContent,
          trends,
          cursors
        );
      }
    }
  }

  return { trends, cursors };
}

export function pickExploreTimelineId(
  response: TwitterExplorePageResponse,
  exploreSectionId: string
): string | null {
  const timelines = response?.data?.explore_page?.body?.timelines;
  if (!Array.isArray(timelines)) {
    return null;
  }
  const row = timelines.find(t => t.id === exploreSectionId);
  const id = row?.timeline?.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function getExploreInitialTimelineInstructions(
  response: TwitterExplorePageResponse
): TimelineInstruction[] | undefined {
  const inst =
    response?.data?.explore_page?.body?.initialTimeline?.timeline?.timeline?.instructions;
  return Array.isArray(inst) ? inst : undefined;
}

export const trendsAPI = async (
  host: TwitterBuildHost,
  kind: PublicExploreTimelineKind,
  count: number
): Promise<APITrendsResponse> => {
  let exploreResponse: TwitterExplorePageResponse;
  try {
    exploreResponse = (await graphqlRequest(host, {
      query: ExplorePageQuery,
      variables: { cursor: '' },
      validator: (r: unknown) => {
        return Boolean(getExploreInitialTimelineInstructions(r as TwitterExplorePageResponse));
      }
    })) as TwitterExplorePageResponse;
  } catch (e) {
    console.error('ExplorePage request failed', e);
    return {
      code: 500,
      timeline_type: kind,
      trends: [],
      cursor: { top: null, bottom: null },
      message: 'Failed to load explore metadata'
    };
  }

  const instructions = getExploreInitialTimelineInstructions(exploreResponse);
  if (!instructions) {
    return {
      code: 404,
      timeline_type: kind,
      trends: [],
      cursor: { top: null, bottom: null },
      message: 'Explore initial timeline not found'
    };
  }

  const { trends: allTrends, cursors } = parseTrendsFromGenericTimelineInstructions(instructions);
  const trends = allTrends.slice(0, Math.max(0, count));
  const top = cursors.find(x => x.cursorType === 'Top')?.value ?? null;
  const bottom = cursors.find(x => x.cursorType === 'Bottom')?.value ?? null;

  return {
    code: 200,
    timeline_type: kind,
    trends,
    cursor: { top, bottom }
  };
};
