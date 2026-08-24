import { Context } from 'hono';
import { Constants } from '../constants';
import { experimentCheck, Experiment } from '../experiments';
import { getGIFTranscodeDomain as getGIFTranscodeDomainCore } from '@fxembed/atmosphere/helpers';

export const getGIFTranscodeDomain = (twitterId: string): string | null =>
  getGIFTranscodeDomainCore(twitterId, Constants.GIF_TRANSCODE_DOMAIN_LIST);

export const shouldTranscodeGif = (c: Context) => {
  return (
    experimentCheck(Experiment.TRANSCODE_GIFS, !!Constants.GIF_TRANSCODE_DOMAIN_LIST) &&
    !c.req.header('user-agent')?.includes('TelegramBot') &&
    !Constants.OLD_EMBED_DOMAINS.includes(new URL(c.req.url).hostname) &&
    !Constants.API_HOST_LIST.includes(new URL(c.req.url).hostname) &&
    !Constants.BLUESKY_API_HOST_LIST.includes(new URL(c.req.url).hostname)
  );
};
