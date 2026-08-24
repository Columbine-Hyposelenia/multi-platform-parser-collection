import { Constants } from '../constants';
import {
  getVideoTranscodeDomain as getVideoTranscodeDomainCore,
  getVideoTranscodeDomainBluesky as getVideoTranscodeDomainBlueskyCore
} from '@fxembed/atmosphere/helpers';

export const getVideoTranscodeDomain = (twitterId: string) =>
  getVideoTranscodeDomainCore(twitterId, Constants.VIDEO_TRANSCODE_DOMAIN_LIST);

export const getVideoTranscodeDomainBluesky = (blueskyDid: string) =>
  getVideoTranscodeDomainBlueskyCore(blueskyDid, Constants.VIDEO_TRANSCODE_BSKY_DOMAIN_LIST);
