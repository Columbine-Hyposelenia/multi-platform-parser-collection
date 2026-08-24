/* Helps create strings for polls! */

import {
  calculateTimeLeft,
  calculateTimeLeftString as calculateTimeLeftStringCore
} from '@fxembed/atmosphere/helpers';
import { Strings } from '../strings';

export { calculateTimeLeft };

const pollTimeStrings = {
  singularDay: Strings.SINGULAR_DAY_LEFT,
  pluralDays: Strings.PLURAL_DAYS_LEFT,
  singularHour: Strings.SINGULAR_HOUR_LEFT,
  pluralHours: Strings.PLURAL_HOURS_LEFT,
  singularMinute: Strings.SINGULAR_MINUTE_LEFT,
  pluralMinutes: Strings.PLURAL_MINUTES_LEFT,
  singularSecond: Strings.SINGULAR_SECOND_LEFT,
  pluralSeconds: Strings.PLURAL_SECONDS_LEFT,
  finalResults: Strings.FINAL_POLL_RESULTS
};

/* TODO: Refactor to support pluralization of other languages */
export const calculateTimeLeftString = (date: Date) =>
  calculateTimeLeftStringCore(date, pollTimeStrings);
