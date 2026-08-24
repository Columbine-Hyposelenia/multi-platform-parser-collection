import { Context } from 'hono';

export const linkHitRequest = async (c: Context) => {
  const userAgent = c.req.header('User-Agent') || '';

  if (userAgent.includes('TelegramBot')) {
    return c.text('', 403);
  }
  const rawUrl = c.req.query('url');
  if (typeof rawUrl === 'string') {
    try {
      const url = new URL(rawUrl);
      return c.redirect(url.href, 302);
    } catch {
      return new Response(null, { status: 204 });
    }
  }
  return new Response(null, { status: 204 });
};

export const linkGoRequest = async (c: Context) => {
  const rawUrl = c.req.query('url');
  if (typeof rawUrl === 'string') {
    try {
      const url = new URL(rawUrl);
      return c.redirect(url.href, 302);
    } catch {
      return new Response(null, { status: 204 });
    }
  }
  return new Response(null, { status: 204 });
};
