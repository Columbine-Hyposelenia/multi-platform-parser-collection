import { getTwitterProviderEnv } from '../twitter-runtime.js';
import { twitterFetch } from './fetch.js';
import type {
  APITypeaheadEvent,
  APITypeaheadResponse,
  APITypeaheadTopic,
  APIUser
} from '../../types/api-schemas.js';
import type { TwitterBuildHost } from './build-host.js';

/** Upstream `1.1/search/typeahead.json` user entry (partial). */
interface TwitterTypeaheadUser {
  id?: number;
  id_str?: string;
  verified?: boolean;
  ext_is_blue_verified?: boolean;
  ext_verified_type?: string;
  name?: string;
  screen_name?: string;
  profile_image_url?: string;
  profile_image_url_https?: string;
  location?: string;
  is_protected?: boolean;
}

interface TwitterTypeaheadTopic {
  topic?: string;
  rounded_score?: number;
  inline?: boolean;
  result_context?: {
    display_string?: string;
    redirect_url?: string;
    redirect_url_tv?: string;
    types?: { type?: string }[];
  };
}

interface TwitterTypeaheadEvent {
  topic?: string;
  topic_type?: string;
  url?: string;
  supporting_text?: string;
  primary_image?: {
    original_info?: {
      url?: string;
      height?: number;
      width?: number;
    };
  };
}

interface TwitterTypeaheadRaw {
  num_results?: number;
  users?: TwitterTypeaheadUser[];
  topics?: TwitterTypeaheadTopic[];
  events?: TwitterTypeaheadEvent[];
  lists?: unknown[];
  query?: string;
  errors?: { code?: number; message?: string }[];
}

const defaultResultTypes = 'events,users,topics';
const ALLOWED_RESULT_TYPES = new Set(['events', 'users', 'topics']);

const normalizeResultTypeParam = (s: string | undefined): string => {
  if (!s?.trim()) return defaultResultTypes;
  const parts = s
    .split(',')
    .map(p => p.trim().toLowerCase())
    .filter((p): p is 'events' | 'users' | 'topics' => ALLOWED_RESULT_TYPES.has(p));
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique.join(',') : defaultResultTypes;
};

const isObjectPayload = (r: unknown): r is TwitterTypeaheadRaw =>
  typeof r === 'object' && r !== null;

export const typeaheadUserToApiUser = (u: TwitterTypeaheadUser): APIUser | null => {
  const id = String(u.id_str ?? u.id ?? '').trim();
  const screen_name = (u.screen_name ?? '').trim();
  if (!id || !screen_name) return null;

  const avatar =
    (typeof u.profile_image_url_https === 'string' && u.profile_image_url_https) ||
    (typeof u.profile_image_url === 'string' && u.profile_image_url) ||
    null;

  let verification: APIUser['verification'];
  const blue = u.ext_is_blue_verified === true;
  const legacyVerified = u.verified === true;
  if (blue) {
    const vt = u.ext_verified_type;
    let type: NonNullable<APIUser['verification']>['type'] = 'individual';
    if (vt === 'Business') type = 'organization';
    else if (vt === 'Government') type = 'government';
    verification = { verified: true, verified_at: null, type };
  } else if (legacyVerified) {
    verification = { verified: true, verified_at: null, type: null };
  } else {
    verification = { verified: false, verified_at: null, type: null };
  }

  return {
    id,
    name: u.name ?? '',
    screen_name,
    avatar_url: avatar,
    banner_url: null,
    description: '',
    raw_description: { text: '', facets: [] },
    location: typeof u.location === 'string' ? u.location : '',
    url: `${getTwitterProviderEnv().webRoot}/${screen_name}`,
    protected: u.is_protected === true,
    followers: 0,
    following: 0,
    statuses: 0,
    media_count: 0,
    likes: 0,
    joined: '',
    website: null,
    verification,
    type: 'profile'
  };
};

export const typeaheadAPI = async (
  q: string,
  host: TwitterBuildHost,
  options?: { resultType?: string; src?: string }
): Promise<APITypeaheadResponse> => {
  const params = new URLSearchParams({
    include_ext_is_blue_verified: '1',
    include_ext_verified_type: '1',
    include_ext_profile_image_shape: '1',
    q,
    src: options?.src?.trim() || 'search_box',
    result_type: normalizeResultTypeParam(options?.resultType)
  });

  const { apiRoot } = getTwitterProviderEnv();
  const url = `${apiRoot}/1.1/search/typeahead.json?${params.toString()}`;

  const raw = await twitterFetch(host, {
    url,
    method: 'GET',
    validateFunction: isObjectPayload
  });

  if (raw === null || !isObjectPayload(raw)) {
    return {
      code: 500,
      query: q,
      num_results: 0,
      users: [],
      topics: [],
      events: []
    };
  }

  if (Array.isArray(raw.errors) && raw.errors.length > 0) {
    return {
      code: 404,
      query: q,
      num_results: 0,
      users: [],
      topics: [],
      events: []
    };
  }

  const users = (raw.users ?? [])
    .map(typeaheadUserToApiUser)
    .filter((u): u is APIUser => u !== null);

  const topics: APITypeaheadTopic[] = (raw.topics ?? [])
    .map((t): APITypeaheadTopic | null => {
      const topic = typeof t.topic === 'string' ? t.topic : '';
      if (!topic) return null;
      const out: APITypeaheadTopic = { topic };
      const rc = t.result_context;
      if (rc && typeof rc === 'object') {
        const ctx: NonNullable<APITypeaheadTopic['result_context']> = {};
        if (typeof rc.display_string === 'string') ctx.display_string = rc.display_string;
        if (typeof rc.redirect_url === 'string') ctx.redirect_url = rc.redirect_url;
        if (Array.isArray(rc.types)) {
          ctx.types = rc.types
            .map(x => (typeof x?.type === 'string' ? { type: x.type } : null))
            .filter((x): x is { type: string } => x !== null);
        }
        if (Object.keys(ctx).length > 0) out.result_context = ctx;
      }
      return out;
    })
    .filter((t): t is APITypeaheadTopic => t !== null);

  const events: APITypeaheadEvent[] = (raw.events ?? [])
    .map((e): APITypeaheadEvent | null => {
      const topic = typeof e.topic === 'string' ? e.topic : '';
      if (!topic) return null;
      const out: APITypeaheadEvent = { topic };
      if (typeof e.url === 'string') out.url = e.url;
      if (typeof e.supporting_text === 'string') out.supporting_text = e.supporting_text;
      const info = e.primary_image?.original_info;
      if (info && typeof info.url === 'string') {
        out.primary_image = {
          url: info.url,
          width: typeof info.width === 'number' ? info.width : undefined,
          height: typeof info.height === 'number' ? info.height : undefined
        };
      }
      return out;
    })
    .filter((e): e is APITypeaheadEvent => e !== null);

  const num_results =
    typeof raw.num_results === 'number'
      ? raw.num_results
      : users.length + topics.length + events.length;

  return {
    code: 200,
    query: typeof raw.query === 'string' ? raw.query : q,
    num_results,
    users,
    topics,
    events
  };
};
