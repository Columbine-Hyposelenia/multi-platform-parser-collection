import { Context } from 'hono';
import type { APIMastodonStatus, APITwitterStatus } from '../realms/api/schemas';
import { Constants } from '../constants';
import { normalizeLanguage } from './language';

const getDomain = (): string | null => {
  const polyglotDomains: string[] = Constants.POLYGLOT_DOMAIN_LIST;
  if (polyglotDomains.length === 0) {
    return null;
  }

  return polyglotDomains[Math.floor(Math.random() * polyglotDomains.length)];
};

/* Handles translating statuses when asked! */
export const translateStatus = async (
  status: APITwitterStatus | APIBlueskyStatus | APIMastodonStatus | APIStatus,
  _language: string,
  _c: Context
): Promise<PolyglotTranslation | null> => {
  const language = normalizeLanguage(_language);

  console.log('Using Polyglot translation');
  const domain = getDomain();
  if (!domain) {
    return null;
  }
  try {
    const response = await fetch(`https://${domain}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Constants.POLYGLOT_ACCESS_TOKEN}`,
        'User-Agent': Constants.FRIENDLY_USER_AGENT
      },
      body: JSON.stringify({ text: status.text, source_lang: status.lang, target_lang: language })
    });

    const data: PolyglotTranslation = await response.json();

    if (!response.ok) {
      console.error('Polyglot translation failed', data);
      return null;
    }

    console.log('Polyglot translation successful', data.translated_text);

    return data;
  } catch (error) {
    console.error('Polyglot translation failed', error);
    return null;
  }
};
