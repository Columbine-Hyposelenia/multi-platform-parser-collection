import type { UserAPIResponse } from '../../types/api-schemas.js';
import { assertSafeMastodonDomain, lookupAccount } from './client.js';
import { mastodonAccountToApiUser } from './processor.js';

const logBodySnippet = (body: string, max = 480): string =>
  body.length <= max ? body : `${body.slice(0, max)}…`;

export const mastodonUserProfileAPI = async (
  username: string,
  domain: string
): Promise<UserAPIResponse> => {
  let result: Awaited<ReturnType<typeof lookupAccount>>;
  let acctForLog: string | undefined;
  try {
    const safeDomain = assertSafeMastodonDomain(domain);
    const acct = username.includes('@') ? username : `${username}@${safeDomain}`;
    acctForLog = acct;
    result = await lookupAccount(safeDomain, acct);
  } catch (e) {
    if (e instanceof Error && e.message === 'invalid_domain') {
      return { code: 400, message: 'Invalid Mastodon domain' };
    }
    console.error('mastodon profile: unexpected error', {
      domain,
      username,
      acct: acctForLog,
      error: e
    });
    return { code: 500, message: 'Mastodon profile request failed' };
  }

  if (!result.ok) {
    if (result.status === 404 || result.status === 400) {
      return { code: 404, message: 'User not found' };
    }
    console.error('mastodon profile: instance lookup failed', {
      domain,
      acct: acctForLog ?? username,
      upstreamStatus: result.status,
      upstreamBody: logBodySnippet(result.body)
    });
    return { code: 500, message: 'Mastodon profile request failed' };
  }

  if (!result.data?.id) {
    return { code: 404, message: 'User not found' };
  }

  try {
    return {
      code: 200,
      message: 'OK',
      user: mastodonAccountToApiUser(result.data, domain)
    };
  } catch (e) {
    console.error('mastodon profile: build user payload failed', {
      domain,
      acct: acctForLog,
      accountId: result.data.id,
      error: e
    });
    return { code: 500, message: 'Mastodon profile request failed' };
  }
};
