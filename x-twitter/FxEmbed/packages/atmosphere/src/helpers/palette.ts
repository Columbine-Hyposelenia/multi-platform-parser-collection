/// <reference path="../raw/vendor/twitter.d.ts" />

const componentToHex = (component: number) => {
  const hex = component.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;

/**
 * Picks a vibrant color from a Twitter `MediaPlaceholderColor` palette, or `fallbackHex` (e.g. `#1b2836`).
 */
export const colorFromPalette = (palette: MediaPlaceholderColor[], fallbackHex: string) => {
  for (let i = 0; i < palette.length; i++) {
    const rgb = palette[i].rgb;

    if (rgb.red + rgb.green + rgb.blue < 120 || rgb.red + rgb.green + rgb.blue > 240 * 3) {
      continue;
    }

    return rgbToHex(rgb.red, rgb.green, rgb.blue);
  }

  if (palette?.[0]?.rgb) {
    return rgbToHex(palette[0].rgb.red, palette[0].rgb.green, palette[0].rgb.blue);
  }

  return fallbackHex;
};
