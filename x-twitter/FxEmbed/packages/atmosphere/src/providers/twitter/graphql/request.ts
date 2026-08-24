import { getTwitterProviderEnv } from '../../twitter-runtime.js';
import { twitterFetch } from '../fetch.js';
import { pickTwitterGqlFeatures, type TwitterGqlFeatureKey } from './features.js';
import type { TwitterBuildHost } from '../build-host.js';

export interface GraphQLQuery {
  httpMethod: string;
  queryId: string;
  queryName: string;
  requiresAccount: boolean;
  variables: Record<string, unknown>;
  featureKeys?: readonly TwitterGqlFeatureKey[];
  fieldToggles?: Record<string, boolean>;
}

interface GraphQLRequest {
  query: GraphQLQuery;
  validator: (response: unknown) => boolean;
  variables: Record<string, unknown>;
  useElongator?: boolean;
  /** Merged last into twitterFetch headers (e.g. `x-twitter-client-language`). */
  headers?: Record<string, string>;
}

export const graphqlRequest = async (
  host: TwitterBuildHost,
  request: GraphQLRequest
): Promise<unknown> => {
  const { query, validator, variables, headers: requestHeaders } = request;
  console.log(`📤 ${query.queryName} (${JSON.stringify(variables)})`);
  const allVariables = { ...query.variables, ...(variables ?? {}) };
  const { apiRoot } = getTwitterProviderEnv();

  let url = `${apiRoot}/graphql/${query.queryId}/${query.queryName}`;
  url += `?variables=${encodeURIComponent(JSON.stringify(allVariables))}`;
  if (query.featureKeys && query.featureKeys.length > 0) {
    const features = pickTwitterGqlFeatures(query.featureKeys);
    url += `&features=${encodeURIComponent(JSON.stringify(features))}`;
  }
  if (query.fieldToggles) {
    url += `&fieldToggles=${encodeURIComponent(JSON.stringify(query.fieldToggles))}`;
  }
  return twitterFetch(host, {
    url,
    method: 'GET',
    headers: requestHeaders,
    validateFunction: validator,
    elongatorRequired: query.requiresAccount
  });
};
