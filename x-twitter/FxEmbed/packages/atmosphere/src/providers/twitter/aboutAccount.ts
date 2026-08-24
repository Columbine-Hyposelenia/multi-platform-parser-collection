import { isTombstone } from '../../helpers/tombstone.js';
import type { APIUser } from '../../types/api-schemas.js';
import type { SocialThread } from '../../types/api-status.js';
import { AboutAccountQuery } from './graphql/queries.js';
import { validateAboutAccountQuery } from './graphql/validators.js';
import { graphQLOrchestrator, GraphQLOrchestratorResult } from './graphql/orchestrator.js';
import { mergeAboutAccountData } from './profile.js';
import type { TwitterBuildHost } from './build-host.js';

const collectScreenNames = (response: SocialThread): Map<string, string> => {
  const screenNames = new Map<string, string>();

  const addScreenName = (author?: APIUser | null) => {
    if (!author?.screen_name) {
      return;
    }
    const key = author.screen_name.toLowerCase();
    if (!screenNames.has(key)) {
      screenNames.set(key, author.screen_name);
    }
  };

  if (response.author) {
    addScreenName(response.author as APIUser);
  }

  if (response.status?.author) {
    addScreenName(response.status.author as APIUser);
  }

  response.thread?.forEach(status => {
    if (!isTombstone(status)) {
      addScreenName(status.author as APIUser);
    }
  });

  return screenNames;
};

const applyAboutAccountData = (response: SocialThread, results: GraphQLOrchestratorResult) => {
  const apply = (author?: APIUser | null) => {
    if (!author?.screen_name) {
      return;
    }
    const key = author.screen_name.toLowerCase();
    const aboutAccount = results[key]?.success
      ? (results[key].data as AboutAccountQueryResponse)
      : null;
    if (aboutAccount) {
      mergeAboutAccountData(author, aboutAccount);
    }
  };

  apply(response.author as APIUser);
  apply(response.status?.author as APIUser);
  response.thread?.forEach(status => {
    if (!isTombstone(status)) apply(status.author as APIUser);
  });
};

export const attachAboutAccountData = async (
  host: TwitterBuildHost,
  response: SocialThread
): Promise<SocialThread> => {
  const screenNames = collectScreenNames(response);

  if (screenNames.size === 0) {
    return response;
  }

  const requests = Array.from(screenNames.entries(), ([key, screenName]) => ({
    key,
    query: AboutAccountQuery,
    variables: { screenName },
    validator: validateAboutAccountQuery,
    required: false
  }));

  const results = await graphQLOrchestrator(host, requests);
  applyAboutAccountData(response, results);

  return response;
};
