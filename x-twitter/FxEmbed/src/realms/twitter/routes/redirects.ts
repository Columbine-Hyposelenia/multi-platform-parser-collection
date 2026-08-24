import { Context } from 'hono';
import { Strings } from '../../../strings';
import { sanitizeText } from '../../../helpers/utils';
import { getBaseRedirectUrl, isHorizonEmbedParam } from '../router';
import { Constants } from '../../../constants';
import { getBranding } from '../../../helpers/branding';
import { Experiment, experimentCheck } from '../../../experiments';

export const genericTwitterRedirect = async (c: Context) => {
  const url = new URL(c.req.url);
  if (isHorizonEmbedParam(url)) {
    c.header('cache-control', 'max-age=0');
    return c.redirect(`${Constants.HORIZON_WEB_ROOT}${url.pathname}`, 302);
  }
  const baseUrl = getBaseRedirectUrl(c);
  /* Do not cache if using a custom redirect */
  const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

  if (cacheControl) {
    c.header('cache-control', cacheControl);
  }

  if (baseUrl.startsWith('twitter:/')) {
    // can't resolve this url to valid deeplink
    return c.redirect(`${Constants.TWITTER_ROOT}/${url.pathname}`, 302);
  }

  if (experimentCheck(Experiment.USE_HORIZON_WEB, baseUrl === Constants.TWITTER_ROOT)) {
    const app = await fetch(`https://app.fxtwitter.com${url.pathname}`);
    const appBody = await app.text();
    if (appBody.includes('<!doctype html>')) {
      return c.html(appBody, 200);
    }
  }

  return c.redirect(`${baseUrl}${url.pathname}`, 302);
};

export const setRedirectRequest = async (c: Context) => {
  /* Query params */
  const { searchParams } = new URL(c.req.url);
  let url = searchParams.get('url');

  /* Check that origin either does not exist or is in our domain list */
  const origin = c.req.header('origin');
  if (origin && !Constants.STANDARD_DOMAIN_LIST.includes(new URL(origin).hostname)) {
    return c.html(
      Strings.MESSAGE_HTML.format({
        message: `Failed to set base redirect: Your request seems to be originating from another domain, please open this up in a new tab if you are trying to set your base redirect.`
      }),
      403
    );
  }

  if (!url) {
    /* Remove redirect URL */
    c.header(
      'set-cookie',
      `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`
    );
    c.header(
      'content-security-policy',
      `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`
    );

    return c.html(
      Strings.MESSAGE_HTML.format({
        brandingName: getBranding(c).name,
        message: `Your base redirect has been cleared. To set one, please pass along the <code>url</code> parameter.`
      }),
      200
    );
  }

  try {
    new URL(url);
  } catch (_e) {
    try {
      new URL(`https://${url}`);
    } catch (_e) {
      /* URL is not well-formed, remove */
      console.log('Invalid base redirect URL, removing cookie before redirect');

      c.header(
        'set-cookie',
        `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`
      );
      c.header(
        'content-security-policy',
        `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`
      );
      return c.html(
        Strings.MESSAGE_HTML.format({
          message: `Your URL does not appear to be well-formed. Example: ?url=https://nitter.net`
        }),
        200
      );
    }

    url = `https://${url}`;
  }

  c.header('set-cookie', `base_redirect=${url}; path=/; max-age=63072000; secure; HttpOnly`);
  c.header(
    'content-security-policy',
    `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`
  );

  return c.html(
    Strings.MESSAGE_HTML.format({
      message: `Successfully set base redirect, you will now be redirected to ${sanitizeText(
        url
      )} rather than ${Constants.TWITTER_ROOT}`,
      brandingName: getBranding(c).name
    })
  );
};
