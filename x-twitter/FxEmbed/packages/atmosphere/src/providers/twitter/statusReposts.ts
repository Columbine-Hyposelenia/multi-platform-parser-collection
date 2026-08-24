import { convertToApiUser } from './profile.js';
import { RetweetersQuery, RetweetersTimelineQuery } from './graphql/queries.js';
import { graphQLOrchestrator } from './graphql/orchestrator.js';
import {
  getRetweetersTimelineInstructions,
  validateRetweetersTimelineResponse
} from './graphql/validators.js';
import { processRetweetersUserTimelineInstructions } from './search.js';
import type { APIUserListResults } from '../../types/api-schemas.js';
import type { TwitterBuildHost } from './build-host.js';

export const statusRepostsAPI = async (
  statusId: string,
  count: number,
  cursor: string | null,
  host: TwitterBuildHost
): Promise<APIUserListResults> => {
  const orchestration = await graphQLOrchestrator(host, [
    {
      key: 'reposts',
      required: true,
      methods: [
        {
          name: 'Retweeters',
          query: RetweetersQuery,
          weight: 500,
          validator: validateRetweetersTimelineResponse
        },
        {
          name: 'RetweetersTimeline',
          query: RetweetersTimelineQuery,
          weight: 500,
          validator: validateRetweetersTimelineResponse
        }
      ],
      variables: {
        tweetId: statusId,
        tweet_id: statusId,
        count,
        cursor: cursor ?? null
      }
    }
  ]);

  if (!orchestration.reposts?.success) {
    console.error('Status reposts request failed', orchestration.reposts?.error);
    return { code: 500, results: [], cursor: { top: null, bottom: null } };
  }

  const instructions = getRetweetersTimelineInstructions(orchestration.reposts.data);
  if (!instructions) {
    return { code: 404, results: [], cursor: { top: null, bottom: null } };
  }

  const { users, cursors } = processRetweetersUserTimelineInstructions(instructions);
  const topCursor = cursors.find(cur => cur.cursorType === 'Top')?.value ?? null;
  const bottomCursor = cursors.find(cur => cur.cursorType === 'Bottom')?.value ?? null;

  const results = users.map(user => convertToApiUser(user));

  return {
    code: 200,
    results,
    cursor: {
      top: topCursor,
      bottom: bottomCursor
    }
  };
};
