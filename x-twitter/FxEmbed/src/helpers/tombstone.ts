import i18next from 'i18next';
import icu from 'i18next-icu';
import {
  isTombstone,
  stripTombstones,
  tombstoneMessageForReason as tombstoneMessageForReasonCore
} from '@fxembed/atmosphere/helpers';
import { normalizeLanguage } from './language';
import translationResources from '../../i18n/resources';
import type { APITombstoneReason, APIStatusTombstone } from '../realms/api/schemas';

export { isTombstone, stripTombstones };

/** User-facing message for API `reason` (i18n when available). */
export const tombstoneMessageForReason = (reason: APITombstoneReason): string =>
  tombstoneMessageForReasonCore(reason, key => (i18next.exists(key) ? i18next.t(key) : key));

async function ensureI18nLanguage(language: string | undefined): Promise<void> {
  const lng = normalizeLanguage(language ?? 'en');
  if (!i18next.isInitialized) {
    await i18next.use(icu).init({
      lng,
      resources: translationResources,
      fallbackLng: 'en'
    });
  } else {
    await i18next.changeLanguage(lng);
  }
}

/** Binds i18n to the request `language` (fallback `en`) and returns a tombstone with `message` set for that locale. */
export async function withLocalizedTombstoneMessage(
  t: APIStatusTombstone,
  language: string | undefined
): Promise<APIStatusTombstone> {
  await ensureI18nLanguage(language);
  return { ...t, message: tombstoneMessageForReason(t.reason) };
}

/** For embed/activity: localized line for a tombstone `reason` in the request target language (fallback `en`). */
export async function getLocalizedTombstoneLine(
  reason: APITombstoneReason,
  language: string | undefined
): Promise<string> {
  await ensureI18nLanguage(language);
  return tombstoneMessageForReason(reason);
}
