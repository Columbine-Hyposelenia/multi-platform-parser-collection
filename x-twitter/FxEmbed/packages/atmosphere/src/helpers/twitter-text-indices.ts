/**
 * Twitter / X text offsets: legacy entities (`indices` on urls, mentions, etc.) are UTF-16 code
 * unit offsets — the same unit JavaScript strings use for indexing and `String#slice`.
 *
 * Note-tweet `raw_text` from GraphQL uses **Unicode scalar** (code point) offsets for
 * entities in `entity_set` (urls, hashtags, media, etc.) and for richtext tags — not UTF-16.
 * Legacy / non–note-tweet `full_text` entities use UTF-16 like JavaScript. Map note-tweet
 * facets once to UTF-16 before the HTML insertion loop (see twitter-text
 * `modifyIndicesFromUnicodeToUTF16`).
 */

const isHighSurrogate = (c: number): boolean => c >= 0xd800 && c <= 0xdbff;
const isLowSurrogate = (c: number): boolean => c >= 0xdc00 && c <= 0xdfff;

/** Advance `i` by one Unicode scalar value; result is <= text.length */
export function utf16IndexAfterNextCodePoint(text: string, i: number): number {
  if (i >= text.length) {
    return i;
  }
  const c = text.charCodeAt(i);
  if (isHighSurrogate(c) && i + 1 < text.length) {
    const c2 = text.charCodeAt(i + 1);
    if (isLowSurrogate(c2)) {
      return i + 2;
    }
  }
  return i + 1;
}

/**
 * UTF-16 string index of the start of the Unicode scalar at offset `unicodeOffset` (0 = start).
 */
export function utf16IndexFromUnicodeScalarOffset(text: string, unicodeOffset: number): number {
  if (unicodeOffset <= 0) {
    return 0;
  }
  let i = 0;
  let cp = 0;
  while (i < text.length && cp < unicodeOffset) {
    i = utf16IndexAfterNextCodePoint(text, i);
    cp++;
  }
  return i;
}

/** Inclusive-start / exclusive-end in Unicode scalars → UTF-16 [start, end) for `slice`. */
export function unicodeScalarRangeToUtf16Range(
  text: string,
  startUnicode: number,
  endUnicode: number
): [number, number] {
  const s = utf16IndexFromUnicodeScalarOffset(text, startUnicode);
  const e = utf16IndexFromUnicodeScalarOffset(text, endUnicode);
  return s <= e ? [s, e] : [e, s];
}

/** If `i` points at a low surrogate, move back to the pair's high surrogate. */
function alignUtf16StartToScalarBoundary(text: string, i: number): number {
  if (i <= 0 || i >= text.length) {
    return i;
  }
  const c = text.charCodeAt(i);
  if (isLowSurrogate(c)) {
    const prev = text.charCodeAt(i - 1);
    if (isHighSurrogate(prev)) {
      return i - 1;
    }
  }
  return i;
}

/**
 * If exclusive end sits between a surrogate pair, extend to include the low surrogate
 * (defensive when offsets are slightly misaligned).
 */
function alignUtf16ExclusiveEndToScalarBoundary(text: string, exclusiveEnd: number): number {
  const len = text.length;
  if (exclusiveEnd <= 0 || exclusiveEnd >= len) {
    return Math.max(0, Math.min(len, exclusiveEnd));
  }
  const before = text.charCodeAt(exclusiveEnd - 1);
  if (isHighSurrogate(before)) {
    const at = text.charCodeAt(exclusiveEnd);
    if (isLowSurrogate(at)) {
      return exclusiveEnd + 1;
    }
  }
  return exclusiveEnd;
}

/** Clamp [start, end) to the string and align to scalar boundaries (for splice + slice). */
export function normalizeUtf16EntityRange(
  text: string,
  start: number,
  end: number
): [number, number] {
  const len = text.length;
  let s = Math.max(0, Math.min(len, start));
  let e = Math.max(0, Math.min(len, end));
  if (e < s) {
    const t = s;
    s = e;
    e = t;
  }
  s = alignUtf16StartToScalarBoundary(text, s);
  e = alignUtf16ExclusiveEndToScalarBoundary(text, e);
  if (e < s) {
    e = s;
  }
  return [s, e];
}

export function sliceByUtf16EntityIndices(text: string, start: number, end: number): string {
  const [s, e] = normalizeUtf16EntityRange(text, start, end);
  return text.slice(s, e);
}

export function facetUtf16RangeOnPlainText(
  plainText: string,
  facet: { indices: [number, number] },
  noteTweetUnicodeScalarFacets: boolean
): [number, number] {
  const [a, b] = facet.indices;
  if (noteTweetUnicodeScalarFacets) {
    return unicodeScalarRangeToUtf16Range(plainText, a, b);
  }
  return [a, b];
}
