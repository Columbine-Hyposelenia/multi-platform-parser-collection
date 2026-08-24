/// <reference path="../raw/vendor/twitter.d.ts" />
/// <reference path="../raw/vendor/bluesky.d.ts" />
import { UnicodeString } from './unicode-string.js';

/** Replace t.co links with their originals (Twitter syndication entities). */
export const linkFixer = (entities: TcoExpansion[] | undefined, text: string): string => {
  if (Array.isArray(entities) && entities.length) {
    entities.forEach((url: TcoExpansion) => {
      let newURL = url.expanded_url ?? url.url ?? '';

      if (newURL.match(/^https:\/\/(x\.com|twitter\.com)\/i\/web\/status\/\w+/g) !== null) {
        newURL = '';
      }
      text = text.replace(url.url, newURL);
    });
  }

  text = text.replace(/ ?https?:\/\/t\.co\/\w{10}/g, '');

  return text;
};

export const linkFixerBluesky = (facets: BlueskyFacet[], text: string): string => {
  let offset = 0;
  if (Array.isArray(facets) && facets.length) {
    facets.forEach((facet: BlueskyFacet) => {
      for (const feature of facet.features) {
        if (feature.$type === 'app.bsky.richtext.facet#link' && feature.uri) {
          const pos = [facet.index.byteStart, facet.index.byteEnd];
          const unicodeText = new UnicodeString(text);
          text =
            unicodeText.slice(0, pos[0] + offset) +
            feature.uri +
            unicodeText.slice(pos[1] + offset);
          offset += feature.uri.length - (pos[1] - pos[0]);
        }
      }
    });
  }

  return text;
};
