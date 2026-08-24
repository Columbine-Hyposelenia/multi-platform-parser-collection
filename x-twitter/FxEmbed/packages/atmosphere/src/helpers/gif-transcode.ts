/** Pick a GIF transcode host from `domains` using a stable hash of `twitterId`. */
export const getGIFTranscodeDomain = (twitterId: string, domains: string[]): string | null => {
  if (domains.length === 0) {
    return null;
  }

  let hash = 0;
  for (let i = 0; i < twitterId.length; i++) {
    const char = twitterId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return domains[Math.abs(hash) % domains.length];
};
