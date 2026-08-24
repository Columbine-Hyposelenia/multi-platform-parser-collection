import { Constants } from '../constants';
import { DataProvider } from '../enum';
import { handleMosaic as handleMosaicAtmosphere } from '@fxembed/atmosphere/helpers';
import type { APIPhoto } from '../realms/api/schemas';

const mosaicConfig = {
  twitterLikeDomains: Constants.MOSAIC_DOMAIN_LIST,
  blueskyDomains: Constants.MOSAIC_BSKY_DOMAIN_LIST
} as const;

/* Handler for mosaic (multi-image combiner) */
export const handleMosaic = async (mediaList: APIPhoto[], id: string, provider: DataProvider) =>
  handleMosaicAtmosphere(mediaList, id, provider, mosaicConfig);
