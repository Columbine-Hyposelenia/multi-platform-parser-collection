import { MiddlewareHandler } from 'hono';
import { Constants } from './constants';
import {} from 'hono';

/* Wrapper to handle caching */
export const cacheMiddleware = (): MiddlewareHandler => async (c, next) => {
  const request = c.req;
  const userAgent = request.header('User-Agent') ?? '';
  // https://developers.cloudflare.com/workers/examples/cache-api/
  let cacheUrl = new URL(request.url);

  // Disable caching for Discord for now because of https://github.com/FxEmbed/FxEmbed/issues/2025
  if (userAgent.includes('Discordbot') || userAgent.includes('Firefox/92')) {
    return await next();
  }

  /* User agents that include both Telegram and Discord should not be cached
     since our response would contain quirks of both platforms. */
  if (userAgent.includes('TelegramBot') && userAgent.includes('Discordbot')) {
    console.log('User agent includes both Telegram and Discord, skipping cache');
    return await next();
  } else if (userAgent.includes('TelegramBot')) {
    cacheUrl = new URL(`${request.url}&telegram`);
  } else if (userAgent.includes('Discordbot')) {
    cacheUrl = new URL(`${request.url}&discord`);
  } else if (userAgent.match(Constants.NATIVE_MULTI_IMAGE_UA_REGEX)) {
    cacheUrl = new URL(`${request.url}&multibot`);
  } else if (userAgent.match(Constants.BOT_UA_REGEX)) {
    cacheUrl = new URL(`${request.url}&bot`);
  }

  console.log('cacheUrl', cacheUrl);

  // Ignore caching on workers.dev, localhost, and 127.0.0.1
  if (
    cacheUrl.hostname.includes('workers.dev') ||
    cacheUrl.hostname.includes('localhost') ||
    cacheUrl.hostname.includes('127.0.0.1')
  ) {
    return await next();
  }

  let cacheKey: Request;
  const apiRealmHost =
    Constants.API_HOST_LIST.includes(cacheUrl.hostname) ||
    Constants.BLUESKY_API_HOST_LIST.includes(cacheUrl.hostname) ||
    Constants.ATMOSPHERE_API_HOST_LIST.includes(cacheUrl.hostname);
  const returnAsJson = apiRealmHost;
  const skipReadThroughCache = apiRealmHost;

  /* If caching unavailable, ignore the rest of the cache middleware */
  if (typeof caches === 'undefined') {
    return await next();
  }

  try {
    cacheKey = new Request(cacheUrl.toString(), request);
  } catch (_e) {
    /* In Miniflare, you can't really create requests like this, so we ignore caching in the test environment */
    return await next();
  }

  const cache = caches.default;

  switch (request.method) {
    case 'GET':
      if (
        !skipReadThroughCache &&
        !cacheUrl.pathname.startsWith('/api/v1/statuses') &&
        !request.header('Cookie')?.includes('base_redirect')
      ) {
        /* cache may be undefined in tests */
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          console.log('Cache hit');
          return new Response(cachedResponse.body, cachedResponse as ResponseInit);
        }

        console.log('Cache miss');
      }

      await next();

      // eslint-disable-next-line no-case-declarations
      const response = c.res.clone();

      /* Store the fetched response as cacheKey
         Use waitUntil so you can return the response without blocking on
         writing to cache */
      try {
        if (c.executionCtx) {
          c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
        }
      } catch (error) {
        console.error((error as Error).stack);
      }

      return response;
    /* Telegram sends this from Webpage Bot, and Cloudflare sends it if we purge cache, and we respect it.
       PURGE is not defined in an RFC, but other servers like Nginx apparently use it. 
       
       Update 2023-11-09:
       
       For some reason, even before migrating to Hono, this returns 403 Forbidden now when PURGEd.
       I'm not sure why, as this is clearly not what we are doing. Is Cloudflare doing this? Is something else wrong? We'll also accept DELETE to do the same I guess. */
    case 'PURGE':
    case 'DELETE':
      console.log('Purging cache as requested');
      await cache.delete(cacheKey);
      if (returnAsJson) return c.json('');
      return c.html('');
    /* yes, we do give HEAD */
    case 'HEAD':
      if (returnAsJson) return c.json('');
      return c.html('');
    /* We properly state our OPTIONS when asked */
    case 'OPTIONS':
      console.log('OPTIONS!!!');
      c.header('Allow', Constants.RESPONSE_HEADERS.allow);
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      c.header('Access-Control-Allow-Headers', '*');
      c.status(200);
      return c.body('');
    default:
      if (returnAsJson) return c.json('');
      return c.html('', 405);
  }
};
