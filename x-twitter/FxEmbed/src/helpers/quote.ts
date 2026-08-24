import i18next from 'i18next';
import { handleQuote as handleQuoteCore } from '@fxembed/atmosphere/helpers';
import type { APIStatusTombstone } from '../realms/api/schemas';
import type { APIStatus } from '../types/apiStatus';

/* Helper for Quote Tweets */
export const handleQuote = (quote: APIStatus | APIStatusTombstone): string | null =>
  handleQuoteCore(quote, {
    quotedFromTombstone: i18next.t('quotedFromTombstone'),
    quotedFrom: i18next.t('quotedFrom')
  });
