import { getBlueskyProviderEnv } from '../bluesky-runtime.js';
import { linkFixerBluesky } from '../../helpers/link-fixer.js';
import type { APIUser, UserAPIResponse } from '../../types/api-schemas.js';
import { blueskyFacetsToApiFacets } from './facets.js';
import { detectBlueskyDescriptionFacets } from './detectDescriptionFacets.js';
import { fetchActorProfile } from './client.js';
import { blueskyVerificationToApiUserVerification } from './verification.js';

export const blueskyProfileToApiUser = (profile: BlueskyProfileViewDetailed): APIUser => {
  const handle = profile.handle;
  const rawText = profile.description ?? '';
  const facets = profile.descriptionFacets?.length
    ? profile.descriptionFacets
    : detectBlueskyDescriptionFacets(rawText);
  const description = linkFixerBluesky(facets, rawText);
  const joined = profile.createdAt ?? profile.indexedAt ?? '';

  const apiUser: APIUser = {
    id: handle,
    name: profile.displayName?.trim() || handle,
    screen_name: handle,
    avatar_url: profile.avatar ?? null,
    banner_url: profile.banner ?? null,
    description,
    raw_description: {
      text: rawText,
      facets: blueskyFacetsToApiFacets(rawText, facets)
    },
    location: '',
    url: `${getBlueskyProviderEnv().webRoot}/profile/${handle}`,
    protected: false,
    followers: profile.followersCount ?? 0,
    following: profile.followsCount ?? 0,
    statuses: profile.postsCount ?? 0,
    media_count: 0,
    likes: 0,
    joined,
    birthday: { day: 0, month: 0, year: 0 },
    website: null,
    profile_embed: false,
    type: 'profile'
  };

  const v = blueskyVerificationToApiUserVerification(profile.verification);
  if (v) apiUser.verification = v;

  return apiUser;
};

export const blueskyUserProfileAPI = async (
  actor: string,
  opts?: { credentialKey?: string }
): Promise<UserAPIResponse> => {
  const result = await fetchActorProfile(actor, { credentialKey: opts?.credentialKey });
  if (!result.ok) {
    if (result.status === 400 || result.status === 404) {
      return { code: 404, message: 'User not found' };
    }
    return { code: 500, message: 'Bluesky profile request failed' };
  }
  if (!result.data?.handle) {
    return { code: 404, message: 'User not found' };
  }
  return {
    code: 200,
    message: 'OK',
    user: blueskyProfileToApiUser(result.data)
  };
};
