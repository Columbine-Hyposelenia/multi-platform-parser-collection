import { withTimeout } from '../../helpers/with-timeout.js';
import { readSetCookieNames } from '../instagram/client.js';
import {
  THREADS_ASBD_ID,
  THREADS_BLOKS_VERSION_ID,
  THREADS_DOC_IDS,
  THREADS_ORIGIN,
  THREADS_RELAY_DEFAULTS,
  THREADS_RELAY_PROFILE_PAGE,
  THREADS_RELAY_USERNAME_HOVERCARD,
  THREADS_WEB_APP_ID
} from './constants.js';
import { extractLsdFromHtml } from './extractors.js';

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function cookieHeaderToMap(cookie: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const part of cookie.split(';')) {
    const t = part.trim();
    const i = t.indexOf('=');
    if (i <= 0) continue;
    m.set(t.slice(0, i), t.slice(i + 1));
  }
  return m;
}

function mapToCookieHeader(map: Map<string, string>): string {
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function mergeCookieHeader(existing: string | undefined, headers: Headers): string {
  const m = cookieHeaderToMap(existing ?? '');
  for (const [k, v] of readSetCookieNames(headers)) {
    m.set(k, v);
  }
  return mapToCookieHeader(m);
}

export type ThreadsSession = {
  cookieHeader: string;
  lsd: string;
  csrf: string;
};

/**
 * One navigation to the Threads homepage: collect cookies (`csrftoken`, `mid`, …) and parse `LSD`
 * from `data-sjs` HTML (same pattern as Instagram web).
 */
export async function fetchThreadsSession(
  userAgent: string | undefined
): Promise<ThreadsSession | null> {
  try {
    const res = await withTimeout(signal =>
      fetch(`${THREADS_ORIGIN}/`, {
        method: 'GET',
        redirect: 'follow',
        signal,
        headers: {
          'User-Agent': userAgent ?? DEFAULT_UA,
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'X-IG-App-ID': THREADS_WEB_APP_ID
        }
      })
    );
    const html = await res.text();
    let cookie = '';
    for (const [k, v] of readSetCookieNames(res.headers)) {
      cookie = cookie ? `${cookie}; ${k}=${v}` : `${k}=${v}`;
    }
    const lsd = extractLsdFromHtml(html);
    const csrfToken = readSetCookieNames(res.headers).get('csrftoken') ?? '';
    if (!lsd || !csrfToken) {
      console.error('[threads] fetchThreadsSession missing lsd or csrftoken', {
        hasLsd: Boolean(lsd),
        hasCsrf: Boolean(csrfToken)
      });
      return null;
    }
    return { cookieHeader: cookie, lsd, csrf: csrfToken };
  } catch (err) {
    console.error('[threads] fetchThreadsSession failed', {
      message: err instanceof Error ? err.message : String(err)
    });
    return null;
  }
}

async function threadsGraphql(params: {
  friendlyName: keyof typeof THREADS_DOC_IDS;
  rootFieldName: string;
  variables: Record<string, unknown>;
  session: ThreadsSession;
  userAgent: string | undefined;
}): Promise<{ ok: boolean; status: number; json: unknown | null }> {
  const docId = THREADS_DOC_IDS[params.friendlyName];
  const body = new URLSearchParams({
    lsd: params.session.lsd,
    doc_id: docId,
    fb_api_req_friendly_name: params.friendlyName,
    fb_api_caller_class: 'RelayModern',
    server_timestamps: 'true',
    variables: JSON.stringify(params.variables)
  });
  try {
    const res = await withTimeout(signal =>
      fetch(`${THREADS_ORIGIN}/graphql/query`, {
        method: 'POST',
        redirect: 'follow',
        signal,
        headers: {
          'User-Agent': params.userAgent ?? DEFAULT_UA,
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': THREADS_ORIGIN,
          'Referer': `${THREADS_ORIGIN}/`,
          'X-IG-App-ID': THREADS_WEB_APP_ID,
          'X-FB-LSD': params.session.lsd,
          'X-CSRFToken': params.session.csrf,
          'X-FB-Friendly-Name': params.friendlyName,
          'X-Root-Field-Name': params.rootFieldName,
          'X-LOGGED-OUT-THREADS-MIGRATED-REQUEST': 'true',
          'X-BLOKS-VERSION-ID': THREADS_BLOKS_VERSION_ID,
          'X-ASBD-ID': THREADS_ASBD_ID,
          'Cookie': params.session.cookieHeader
        },
        body: body.toString()
      })
    );
    const mergedCookies = mergeCookieHeader(params.session.cookieHeader, res.headers);
    params.session.cookieHeader = mergedCookies;
    if (!res.ok) {
      return { ok: false, status: res.status, json: null };
    }
    return { ok: true, status: res.status, json: (await res.json()) as unknown };
  } catch (err) {
    console.error('[threads] threadsGraphql failed', {
      friendlyName: params.friendlyName,
      message: err instanceof Error ? err.message : String(err)
    });
    return { ok: false, status: 500, json: null };
  }
}

export async function fetchThreadsPostPage(params: {
  mediaId: string;
  sortOrder: 'TOP' | 'RECENT';
  after: string | null;
  first: number | null;
  session: ThreadsSession;
  userAgent: string | undefined;
}): Promise<{ ok: boolean; status: number; json: unknown | null }> {
  const variables: Record<string, unknown> = {
    postID: params.mediaId,
    sort_order: params.sortOrder,
    ...THREADS_RELAY_DEFAULTS
  };
  if (params.after) variables.after = params.after;
  if (params.first != null) variables.first = params.first;

  return threadsGraphql({
    friendlyName: 'BarcelonaPostPageDirectQuery',
    rootFieldName: 'xdt_api__v1__text_feed__media_id__replies__connection',
    variables,
    session: params.session,
    userAgent: params.userAgent
  });
}

export async function fetchThreadsUserByUsername(params: {
  username: string;
  session: ThreadsSession;
  userAgent: string | undefined;
}): Promise<{ ok: boolean; status: number; json: unknown | null }> {
  return threadsGraphql({
    friendlyName: 'BarcelonaUsernameHovercardImplDirectQuery',
    rootFieldName: 'xdt_text_app_user_by_username',
    variables: {
      username: params.username.replace(/^@/, ''),
      ...THREADS_RELAY_USERNAME_HOVERCARD
    },
    session: params.session,
    userAgent: params.userAgent
  });
}

export async function fetchThreadsProfilePage(params: {
  userId: string;
  session: ThreadsSession;
  userAgent: string | undefined;
}): Promise<{ ok: boolean; status: number; json: unknown | null }> {
  return threadsGraphql({
    friendlyName: 'BarcelonaProfilePageDirectQuery',
    rootFieldName: 'xdt_text_app_user',
    variables: {
      canSeeFeedsTab: true,
      userID: params.userId,
      ...THREADS_RELAY_PROFILE_PAGE
    },
    session: params.session,
    userAgent: params.userAgent
  });
}

export async function fetchThreadsProfileTimeline(params: {
  userId: string;
  first: number;
  after: string | null;
  session: ThreadsSession;
  userAgent: string | undefined;
}): Promise<{ ok: boolean; status: number; json: unknown | null }> {
  return threadsGraphql({
    friendlyName: 'BarcelonaProfileThreadsTabRefetchableDirectQuery',
    rootFieldName: 'xdt_api__v1__text_feed__user_id__profile__connection',
    variables: {
      after: params.after,
      allow_page_info_for_lox_user: true,
      before: null,
      first: params.first,
      last: null,
      userID: params.userId,
      ...THREADS_RELAY_DEFAULTS,
      __relay_internal__pv__BarcelonaHasProfileSelfReplyContextrelayprovider: false
    },
    session: params.session,
    userAgent: params.userAgent
  });
}
