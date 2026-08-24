import { getBlueskyProviderEnv } from '../bluesky-runtime.js';

/** Record key segment from an AT URI like `at://did/app.bsky.feed.post/<rkey>`. */
export const rkeyFromPostAtUri = (uri: string | undefined | null): string | null => {
  if (!uri) return null;
  const m = uri.match(/\/app\.bsky\.feed\.post\/([^/]+)\/?$/);
  return m?.[1] ?? null;
};

/** AT-URI for a feed post; `repo` may be a handle or DID (AppView resolves). */
export const atUriForFeedPost = (repo: string, rkey: string): string =>
  `at://${repo}/app.bsky.feed.post/${rkey}`;

/** DID from AT URI `at://<did>/...` when the repo segment is a DID (not a handle). */
export const didFromAtUri = (uri: string | undefined | null): string | null => {
  if (!uri?.startsWith('at://')) return null;
  const rest = uri.slice('at://'.length);
  const did = rest.split('/')[0];
  if (!did || !did.startsWith('did:')) return null;
  const methodEnd = did.indexOf(':', 4);
  if (methodEnd === -1 || methodEnd === did.length - 1) return null;
  const method = did.slice(4, methodEnd);
  if (!/^[a-z0-9]+$/.test(method)) return null;
  return did;
};

export const blueskyWebPostUrl = (handle: string, rkey: string): string =>
  `${getBlueskyProviderEnv().webRoot}/profile/${handle}/post/${rkey}`;
