import { UnicodeString } from '../../helpers/unicode-string.js';

/** UTF-16 code unit range → UTF-8 byte range (Bluesky facet indices). */
function utf16RangeToUtf8Bytes(
  text: string,
  startUtf16: number,
  endUtf16: number
): { byteStart: number; byteEnd: number } {
  const u = new UnicodeString(text);
  return {
    byteStart: u.utf16IndexToUtf8Index(startUtf16),
    byteEnd: u.utf16IndexToUtf8Index(endUtf16)
  };
}

/** Drop overlapping facets (by UTF-8 byte range); earlier byteStart wins. */
function dedupeFacetsByByteRange(facets: BlueskyFacet[]): BlueskyFacet[] {
  const sorted = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart);
  const out: BlueskyFacet[] = [];
  let lastEnd = -1;
  for (const f of sorted) {
    if (f.index.byteStart < lastEnd) continue;
    out.push(f);
    lastEnd = f.index.byteEnd;
  }
  return out;
}

function isProbableHandle(handle: string): boolean {
  if (handle.length < 2 || handle.length > 253) return false;
  if (handle.includes('.')) {
    return /^[a-z0-9._-]+$/i.test(handle) && /[a-z]/i.test(handle);
  }
  return /^[a-z][a-z0-9_-]*$/i.test(handle);
}

/**
 * `app.bsky.actor.getProfile` does not include `descriptionFacets` in the lexicon.
 * Mirror client behavior by detecting links, @mentions, and #tags in plain description text.
 */
export function detectBlueskyDescriptionFacets(text: string): BlueskyFacet[] {
  if (!text.trim()) return [];
  const utf16 = text;
  const facets: BlueskyFacet[] = [];

  {
    const re = /(^|[\s(])@([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(utf16))) {
      const atPos = m.index + m[1].length;
      const handle = m[2];
      if (!isProbableHandle(handle)) continue;
      const start = atPos;
      const end = atPos + 1 + handle.length;
      const { byteStart, byteEnd } = utf16RangeToUtf8Bytes(text, start, end);
      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#mention', handle }]
      });
    }
  }

  {
    const re =
      /(^|[\s(])((https?:\/\/[^\s<()[\]{}]+)|((?:[a-z][-a-z0-9]*\.)+[a-z][-a-z0-9]+[^\s<()[\]{}]*))/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(utf16))) {
      const lead = m[1];
      let linkText = m[2];
      const start = m.index + lead.length;
      let end = start + linkText.length;

      linkText = linkText.replace(/[.,;:!?)]+$/, trail => {
        end -= trail.length;
        return '';
      });
      if (!linkText) continue;

      let uri = linkText;
      if (!/^https?:\/\//i.test(linkText)) {
        uri = `https://${linkText}`;
      }

      const host = linkText.replace(/^https?:\/\//i, '').split(/[/\s#?]/)[0] ?? '';
      if (!host.includes('.') || !/^[a-z0-9.-]+$/i.test(host)) continue;

      const { byteStart, byteEnd } = utf16RangeToUtf8Bytes(text, start, end);
      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri }]
      });
    }
  }

  {
    const re = /(^|\s)(#[^\d\s#][^\s#]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(utf16))) {
      const leadLen = m[1].length;
      const start = m.index + leadLen;
      let raw = m[2];
      raw = raw.replace(/\p{P}+$/gu, '');
      const end = start + raw.length;
      if (raw.length < 2) continue;
      const tag = raw.startsWith('#') ? raw.slice(1) : raw;
      if (!tag || tag.length > 640) continue;
      const { byteStart, byteEnd } = utf16RangeToUtf8Bytes(text, start, end);
      facets.push({
        index: { byteStart, byteEnd },
        features: [{ $type: 'app.bsky.richtext.facet#tag', tag }]
      });
    }
  }

  return dedupeFacetsByByteRange(facets);
}
