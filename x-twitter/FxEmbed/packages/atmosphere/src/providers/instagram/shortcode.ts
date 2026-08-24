const ENCODING_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Decode Instagram shortcode to numeric media pk (first segment before `_` in media id).
 * Ported from yt-dlp `InstagramIE._id_to_pk`.
 */
export function instagramShortcodeToPk(shortcode: string): bigint {
  let s = shortcode.trim();
  if (s.length > 28) {
    s = s.slice(0, -28);
  }
  const base = BigInt(ENCODING_CHARS.length);
  let n = 0n;
  for (const ch of s) {
    const idx = ENCODING_CHARS.indexOf(ch);
    if (idx < 0) {
      throw new Error(`Invalid Instagram shortcode character: ${ch}`);
    }
    n = n * base + BigInt(idx);
  }
  return n;
}

export function normalizeInstagramPostId(raw: string): string {
  const t = raw.trim();
  const reel = t.match(/instagram\.com\/(?:[^/]+\/)?reel\/([^/?#]+)/i);
  if (reel?.[1]) return reel[1];
  const p = t.match(/instagram\.com\/(?:[^/]+\/)?p\/([^/?#]+)/i);
  if (p?.[1]) return p[1];
  const tv = t.match(/instagram\.com\/(?:[^/]+\/)?tv\/([^/?#]+)/i);
  if (tv?.[1]) return tv[1];
  return t.replace(/^\/+|\/+$/g, '');
}
