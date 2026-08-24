import type { BlueskyOAuthClientConfig } from './types.js';

/** ATProto OAuth client metadata (served as JSON at `client_id` URL). */
export type BlueskyClientMetadataJson = {
  client_id: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
  redirect_uris: string[];
  scope: string;
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  application_type?: string;
  dpop_bound_access_tokens: boolean;
};

/**
 * Build `client_metadata.json` body. The consumer must serve this JSON at the exact URL
 * given as `clientId` (that URL is the OAuth `client_id`).
 */
export function buildBlueskyClientMetadata(
  config: BlueskyOAuthClientConfig
): BlueskyClientMetadataJson {
  const applicationType = config.applicationType ?? 'native';
  return {
    client_id: config.clientId,
    client_name: config.clientName,
    client_uri: config.clientUri,
    logo_uri: config.logoUri,
    policy_uri: config.policyUri,
    tos_uri: config.tosUri,
    redirect_uris: [...config.redirectUris],
    scope: config.scope,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: applicationType,
    dpop_bound_access_tokens: true
  };
}
