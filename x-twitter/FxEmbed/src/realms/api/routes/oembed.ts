import { Context } from 'hono';
import { Constants } from '../../../constants';
import { Strings } from '../../../strings';
import type { OEmbed } from '../../../types/types';
import { getBranding } from '../../../helpers/branding';

export const oembed = async (c: Context) => {
  const { searchParams } = new URL(c.req.url);

  const text = searchParams.get('text') ?? 'Twitter';
  const author = searchParams.get('author') ?? 'jack';
  const status = searchParams.get('status') ?? '20';

  const statusUrl = `${Constants.TWITTER_ROOT}/${encodeURIComponent(author)}/status/${status}`;
  const branding = getBranding(c);

  const data: OEmbed = {
    author_name: text,
    author_url: statusUrl,
    provider_name: searchParams.get('provider') ?? branding.name,
    provider_url: searchParams.get('provider') ? statusUrl : branding.redirect,
    title: Strings.DEFAULT_AUTHOR_TEXT,
    type: 'rich',
    version: '1.0'
  };

  for (const [header, value] of Object.entries(Constants.API_RESPONSE_HEADERS)) {
    c.header(header, value);
  }
  return c.json(data, 200);
};
