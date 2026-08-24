import { Constants } from '../constants';
import { colorFromPalette as colorFromPaletteCore } from '@fxembed/atmosphere/helpers';

/* Selects the (hopefully) best color from Twitter's palette */
export const colorFromPalette = (palette: MediaPlaceholderColor[]) =>
  colorFromPaletteCore(palette, Constants.DEFAULT_COLOR);
