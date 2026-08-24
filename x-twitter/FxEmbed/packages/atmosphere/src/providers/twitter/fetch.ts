import { generateUserAgent } from '../../helpers/user-agent.js';
import { generateSnowflake } from '../../helpers/snowflake.js';
import { withTimeout } from '../../helpers/with-timeout.js';
import { detokenize } from '../../helpers/detokenize.js';
import { hasTwitterAccountProxy } from './accountProxy.js';
import { getTwitterProviderEnv, getTwitterProxyRuntime } from '../twitter-runtime.js';
import { proxyTwitterRequest } from './proxy/handler.js';
import type { TwitterBuildHost } from './build-host.js';

const API_ATTEMPTS = 3;

interface TwitterFetchOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  useElongator?: boolean;
  validateFunction?: (response: unknown) => boolean;
  elongatorRequired?: boolean;
}

type TwitterAccountProxyEnv = {
  TwitterProxy?: { fetch: typeof fetch };
  CREDENTIAL_KEY?: string;
};

function accountProxyEnvFromHost(host: TwitterBuildHost): TwitterAccountProxyEnv {
  return {
    TwitterProxy: host.twitterProxy,
    CREDENTIAL_KEY: host.credentialKey
  };
}

export const twitterFetch = async (
  host: TwitterBuildHost,
  options: TwitterFetchOptions
): Promise<unknown> => {
  const env = getTwitterProviderEnv();
  const { url, method, headers: _headers, body, validateFunction, elongatorRequired } = options;
  let useElongator = options.useElongator ?? hasTwitterAccountProxy(accountProxyEnvFromHost(host));
  let apiAttempts = 0;
  let newTokenGenerated = false;
  let wasAccountProxyDisabled = false;

  const [userAgent, secChUa] = generateUserAgent();

  const tokenHeaders: { [header: string]: string } = {
    'Authorization': env.guestBearerToken,
    'User-Agent': userAgent,
    'sec-ch-ua': secChUa,
    ...env.baseHeaders
  };

  const guestTokenRequest = new Request(`${env.apiRoot}/1.1/guest/activate.json`, {
    method: 'POST',
    headers: tokenHeaders,
    cf: {
      cacheEverything: true,
      cacheTtl: env.guestTokenMaxAge
    },
    body: ''
  } as RequestInit);

  const guestTokenRequestCacheDummy = new Request(`${env.apiRoot}/1.1/guest/activate.json`, {
    method: 'GET',
    cf: {
      cacheEverything: true,
      cacheTtl: env.guestTokenMaxAge
    }
  } as RequestInit);

  const cache =
    typeof caches !== 'undefined' ? (caches as unknown as { default: Cache }).default : null;

  while (apiAttempts < API_ATTEMPTS) {
    const csrfToken = crypto.randomUUID().replace(/-/g, '');

    const headers: Record<string, string> = {
      Authorization: env.guestBearerToken,
      ...env.baseHeaders,
      ...(_headers ?? {})
    };

    apiAttempts++;

    let activate: Response | null = null;

    if (cache === null) {
      console.log('Caching unavailable, requesting new token');
      newTokenGenerated = true;
    }

    if (!newTokenGenerated && !useElongator && cache) {
      const timeBefore = performance.now();
      const cachedResponse = await cache.match(guestTokenRequestCacheDummy.clone());
      const timeAfter = performance.now();

      console.log(`Searched cache for token, took ${timeAfter - timeBefore}ms`);

      if (cachedResponse) {
        console.log('Token cache hit');
        activate = cachedResponse;
      } else {
        console.log('Token cache miss');
        newTokenGenerated = true;
      }
    }

    if (newTokenGenerated || (activate === null && !useElongator)) {
      const timeBefore = performance.now();
      activate = await fetch(guestTokenRequest.clone());
      const timeAfter = performance.now();

      console.log(`Guest token request after ${timeAfter - timeBefore}ms`);
    }

    let activateJson: { guest_token: string };

    try {
      activateJson = (await activate?.clone().json()) as { guest_token: string };
    } catch (_e) {
      continue;
    }

    const guestToken = activateJson?.guest_token || generateSnowflake();

    if (activateJson) {
      console.log(newTokenGenerated ? 'Activated guest:' : 'Using guest:', activateJson);
    }

    headers['Cookie'] = [
      `guest_id_ads=v1%3A${guestToken}`,
      `guest_id_marketing=v1%3A${guestToken}`,
      `guest_id=v1%3A${guestToken}`,
      `ct0=${csrfToken};`
    ].join('; ');

    headers['x-csrf-token'] = csrfToken;
    headers['x-twitter-active-user'] = 'yes';
    headers['x-guest-token'] = guestToken;
    let response: unknown;
    let apiRequest: Response | null;

    try {
      if (useElongator && typeof host.twitterProxy !== 'undefined') {
        const performanceStart = performance.now();
        const headers2 = headers;
        headers2['x-twitter-auth-type'] = 'OAuth2Session';
        apiRequest = await withTimeout((signal: AbortSignal) =>
          host.twitterProxy!.fetch(url, {
            method: method,
            headers: headers2,
            signal: signal,
            body: body
          })
        );
        const performanceEnd = performance.now();
        console.log(`Account proxy request finished after ${performanceEnd - performanceStart}ms`);
      } else if (useElongator && host.credentialKey) {
        const performanceStart = performance.now();
        const headers2 = { ...headers };
        headers2['x-twitter-auth-type'] = 'OAuth2Session';
        const rt = getTwitterProxyRuntime();
        await rt.initCredentials(host.credentialKey);
        let usedInProcessAccountProxy = false;
        if (rt.hasDecryptedCredentials()) {
          usedInProcessAccountProxy = true;
          apiRequest = await withTimeout((signal: AbortSignal) =>
            proxyTwitterRequest(
              new Request(url, {
                method: method ?? 'GET',
                headers: headers2,
                signal,
                body
              }),
              {
                CREDENTIAL_KEY: host.credentialKey,
                EXCEPTION_DISCORD_WEBHOOK: host.exceptionWebhookUrl
              }
            )
          );
        } else {
          console.log('CREDENTIAL_KEY set but no bundled accounts; using guest API');
          apiRequest = await withTimeout((signal: AbortSignal) =>
            fetch(url, {
              method: method,
              headers: headers,
              signal: signal,
              body: body
            })
          );
        }
        const performanceEnd = performance.now();
        console.log(
          `${usedInProcessAccountProxy ? 'Account proxy' : 'Guest API'} request finished after ${performanceEnd - performanceStart}ms`
        );
      } else {
        const performanceStart = performance.now();
        apiRequest = await withTimeout((signal: AbortSignal) =>
          fetch(url, {
            method: method,
            headers: headers,
            signal: signal,
            body: body
          })
        );
        const performanceEnd = performance.now();
        console.log(`Guest API request successful after ${performanceEnd - performanceStart}ms`);
      }

      const _response = (await apiRequest?.text()) ?? '';
      try {
        response = JSON.parse(_response);
      } catch (_e) {
        if (_response.split('\n').length > 1) {
          response = detokenize(_response);
        } else {
          throw new Error(`Failed to parse response as JSON ${_e}`, { cause: _e });
        }
      }
    } catch (e: unknown) {
      console.error('Unknown error while fetching from API', e);
      if (String(e).indexOf('Status not found') !== -1) {
        console.log('Tweet was not found');
        return null;
      }
      try {
        if (!useElongator && cache && host.waitUntil) {
          host.waitUntil(cache.delete(guestTokenRequestCacheDummy.clone(), { ignoreMethod: true }));
        }
      } catch (error) {
        console.error((error as Error).stack);
      }
      if (useElongator) {
        if (elongatorRequired) {
          console.log('Account proxy was required, but we failed to fetch a valid response');
          return {};
        }
        console.log('Account proxy request failed, trying again without it');
        wasAccountProxyDisabled = true;
      }
      newTokenGenerated = true;
      useElongator = false;
      continue;
    }

    if (
      !wasAccountProxyDisabled &&
      !useElongator &&
      hasTwitterAccountProxy(accountProxyEnvFromHost(host)) &&
      (response as TweetResultByRestIdResponse)?.data?.tweetResult?.result?.reason ===
        'NsfwLoggedOut'
    ) {
      console.log(`nsfw tweet detected, retrying with account proxy`);
      useElongator = true;
      continue;
    }

    const remainingRateLimit = parseInt(apiRequest?.headers.get('x-rate-limit-remaining') || '0');
    console.log(`Remaining rate limit: ${remainingRateLimit} requests`);
    if (!useElongator && remainingRateLimit < 10) {
      console.log(`Purging token on this edge due to low rate limit remaining`);
      try {
        if (host.waitUntil && cache) {
          host.waitUntil(cache.delete(guestTokenRequestCacheDummy.clone(), { ignoreMethod: true }));
        }
      } catch (error) {
        console.error((error as Error).stack);
      }
    }

    if (validateFunction && !validateFunction(response)) {
      console.log('Failed to fetch response, got', JSON.stringify(response));
      if (elongatorRequired) {
        console.log('Account proxy was required, but we failed to fetch a valid response');
        return {};
      }
      if (useElongator) {
        console.log('Account proxy request failed to validate, trying again without it');
        wasAccountProxyDisabled = true;
      }
      useElongator = false;
      newTokenGenerated = true;
      continue;
    }
    try {
      if (host.waitUntil && newTokenGenerated && activate && cache) {
        const cachingResponse = new Response(await activate.clone().text(), {
          headers: {
            ...tokenHeaders,
            'cache-control': `max-age=${env.guestTokenMaxAge}`
          }
        });
        console.log('Caching guest token');
        host.waitUntil(cache.put(guestTokenRequestCacheDummy.clone(), cachingResponse));
      }
    } catch (error) {
      console.error((error as Error).stack);
    }
    console.log('twitterFetch is all done here, see you soon!');
    return response;
  }

  console.log('Twitter has repeatedly denied our requests, so we give up now');

  return null;
};
