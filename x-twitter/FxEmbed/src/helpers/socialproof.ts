import { Constants } from '../constants';
import {
  getActivitySocialProof as getActivitySocialProofCore,
  getSocialProof as getSocialProofCore,
  getSocialTextIV as getSocialTextIVCore
} from '@fxembed/atmosphere/helpers';
import type { APIStatus } from '../types/apiStatus';
import type { APITwitterStatus } from '../realms/api/schemas';

export const getSocialProof = (status: APIStatus): string | null => getSocialProofCore(status);

export const getActivitySocialProof = (status: APIStatus): string | null =>
  getActivitySocialProofCore(status, Constants.TWITTER_ROOT);

export const getSocialTextIV = (status: APITwitterStatus): string | null =>
  getSocialTextIVCore(status);
