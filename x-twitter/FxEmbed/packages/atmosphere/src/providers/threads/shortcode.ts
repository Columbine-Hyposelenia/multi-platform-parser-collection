import { instagramShortcodeToPk } from '../instagram/shortcode.js';

/** Decode Threads post shortcode to numeric `postID` for Barcelona GraphQL. */
export function threadsShortcodeToMediaId(shortcode: string): string {
  return instagramShortcodeToPk(shortcode.trim()).toString();
}

/**
 * Normalize user input to a bare post shortcode (alphanumeric + `_-`).
 * Accepts full `threads.com` / `threads.net` permalinks.
 */
export function normalizeThreadsPostId(raw: string): string {
  const t = raw.trim();
  const mPost =
    t.match(/threads\.(?:com|net)\/(?:@[^/]+\/)?post\/([^/?#]+)/i) ??
    t.match(/threads\.(?:com|net)\/t\/([^/?#]+)/i);
  if (mPost?.[1]) return mPost[1];
  return t.replace(/^\/+|\/+$/g, '');
}
