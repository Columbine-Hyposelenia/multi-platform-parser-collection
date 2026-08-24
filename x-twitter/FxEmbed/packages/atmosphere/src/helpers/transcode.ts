/** Pick a video transcode host from `domains` using a stable hash of `id` (Twitter snowflake). */
export const getVideoTranscodeDomain = (twitterId: string, domains: string[]): string | null => {
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

/** Pick a Bluesky-oriented transcode host from `domains` using a hash of `blueskyDid`. */
export const getVideoTranscodeDomainBluesky = (
  blueskyDid: string,
  domains: string[]
): string | null => {
  if (domains.length === 0) {
    return null;
  }

  let hash = 0;
  for (let i = 0; i < blueskyDid.length; i++) {
    const char = blueskyDid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return domains[Math.abs(hash) % domains.length];
};
