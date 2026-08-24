import type { ResolvedBlueskyIdentity } from './types.js';
import { fetchOAuthProtectedResourceMetadata } from './metadata.js';

function trimSlash(s: string): string {
  return s.replace(/\/$/, '');
}

function normalizeInput(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('@')) s = s.slice(1);
  if (s.startsWith('at://')) {
    const rest = s.slice('at://'.length);
    const slash = rest.indexOf('/');
    s = slash >= 0 ? rest.slice(0, slash) : rest;
  }
  return s;
}

/** `did:web:` → hostname for `/.well-known/did.json` (hostname only; use percent-encoding in DID for ports). */
export function didWebToHostname(did: string): string {
  const prefix = 'did:web:';
  if (!did.toLowerCase().startsWith(prefix)) {
    throw new Error('didWebToHostname: not did:web');
  }
  const id = did.slice(prefix.length);
  if (!id || id.includes('/')) {
    throw new Error('didWebToHostname: path-style did:web not supported in this build');
  }
  return decodeURIComponent(id);
}

function isDid(s: string): boolean {
  return s.startsWith('did:');
}

async function fetchText(url: string, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(url, { headers: { Accept: 'text/plain, application/json' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Bluesky App View — resolves handles registered in the network (incl. custom domains without `/.well-known/`). */
const PUBLIC_RESOLVE_HANDLE_XRPC =
  'https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle';

async function resolveHandleToDidViaPublicApi(
  handle: string,
  fetchImpl: typeof fetch
): Promise<string | null> {
  const url = `${PUBLIC_RESOLVE_HANDLE_XRPC}?handle=${encodeURIComponent(handle)}`;
  try {
    const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = (await res.json()) as { did?: unknown };
    const did = typeof json.did === 'string' ? json.did.trim() : '';
    return did.startsWith('did:') ? did : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a handle to a DID: try `https://{handle}/.well-known/atproto-did` first, then
 * `com.atproto.identity.resolveHandle` on `public.api.bsky.app` (handles missing HTTPS proofs).
 */
export async function resolveHandleToDid(
  handle: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  const h = handle.trim().replace(/^@/, '');
  if (!h || h.startsWith('did:')) return h.startsWith('did:') ? h : null;
  const wellKnownUrl = `https://${h}/.well-known/atproto-did`;
  const text = (await fetchText(wellKnownUrl, fetchImpl))?.trim();
  if (text?.startsWith('did:')) return text.split(/\s+/)[0] ?? null;
  return resolveHandleToDidViaPublicApi(h, fetchImpl);
}

type PlcDirectoryDoc = {
  id?: string;
  alsoKnownAs?: string[];
  service?: { id?: string; type?: string; serviceEndpoint?: string | { value?: string } }[];
};

function serviceEndpointUrl(ep: string | { value?: string } | undefined): string | null {
  if (typeof ep === 'string' && ep.startsWith('http')) return trimSlash(ep);
  if (ep && typeof ep === 'object' && typeof ep.value === 'string' && ep.value.startsWith('http')) {
    return trimSlash(ep.value);
  }
  return null;
}

function pdsFromDidDoc(doc: PlcDirectoryDoc): string | null {
  const services = doc.service ?? [];
  for (const s of services) {
    const t = (s.type ?? '').toLowerCase();
    if (
      t.includes('atproto-personal-data-server') ||
      t.includes('atpersonaldataserver') ||
      t.includes('personaldata') ||
      t.includes('reposervice')
    ) {
      const url = serviceEndpointUrl(s.serviceEndpoint);
      if (url) return url;
    }
  }
  for (const s of services) {
    const url = serviceEndpointUrl(s.serviceEndpoint);
    if (url) return url;
  }
  return null;
}

function handleFromAlsoKnownAs(alsoKnownAs: string[] | undefined, did: string): string {
  if (!alsoKnownAs?.length) return did;
  for (const a of alsoKnownAs) {
    if (a.startsWith('at://') && !a.includes('/app.bsky')) {
      const path = a.replace('at://', '');
      const slash = path.indexOf('/');
      if (slash > 0) {
        const repo = path.slice(0, slash);
        if (!repo.startsWith('did:')) return repo;
      }
    }
  }
  return did;
}

/** Resolve `did:plc:…` via plc.directory. */
export async function resolveDidPlc(
  did: string,
  fetchImpl: typeof fetch = fetch
): Promise<{
  did: string;
  handle: string;
  pdsOrigin: string;
}> {
  const url = `https://plc.directory/${encodeURIComponent(did)}`;
  const res = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  if (!res.ok) throw new Error(`plc.directory: ${res.status} ${text.slice(0, 200)}`);
  const doc = JSON.parse(text) as PlcDirectoryDoc;
  const pdsOrigin = pdsFromDidDoc(doc);
  if (!pdsOrigin) throw new Error('plc.directory: no PDS serviceEndpoint');
  const handle = handleFromAlsoKnownAs(doc.alsoKnownAs, did);
  return { did: doc.id ?? did, handle, pdsOrigin };
}

/** Resolve `did:web:…` via HTTPS did document. */
export async function resolveDidWeb(
  did: string,
  fetchImpl: typeof fetch = fetch
): Promise<{
  did: string;
  handle: string;
  pdsOrigin: string;
}> {
  const host = didWebToHostname(did);
  const docUrl = `https://${host}/.well-known/did.json`;
  const res = await fetchImpl(docUrl, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  if (!res.ok) throw new Error(`did:web document: ${res.status} ${text.slice(0, 200)}`);
  const doc = JSON.parse(text) as PlcDirectoryDoc;
  const pdsOrigin = pdsFromDidDoc(doc);
  if (!pdsOrigin) throw new Error('did:web did.json: no PDS serviceEndpoint');
  const handle = handleFromAlsoKnownAs(doc.alsoKnownAs, did);
  return { did: doc.id ?? did, handle, pdsOrigin };
}

async function resolveDidToPds(
  did: string,
  fetchImpl: typeof fetch
): Promise<{
  did: string;
  handle: string;
  pdsOrigin: string;
}> {
  if (did.startsWith('did:plc:')) return resolveDidPlc(did, fetchImpl);
  if (did.toLowerCase().startsWith('did:web:')) return resolveDidWeb(did, fetchImpl);
  throw new Error(`resolveDidToPds: unsupported DID method: ${did.split(':')[1] ?? 'unknown'}`);
}

/**
 * Resolve a Bluesky handle or DID to PDS + OAuth authorization server hints.
 * `authServerOrigin` is the first entry from `/.well-known/oauth-protected-resource` on the PDS.
 */
export async function resolveBlueskyIdentity(
  handleOrDid: string,
  fetchImpl: typeof fetch = fetch
): Promise<ResolvedBlueskyIdentity> {
  const input = normalizeInput(handleOrDid);
  if (!input) throw new Error('resolveBlueskyIdentity: empty input');

  let did: string;
  let handle: string;
  let pdsOrigin: string;

  if (isDid(input)) {
    const r = await resolveDidToPds(input, fetchImpl);
    did = r.did;
    handle = r.handle;
    pdsOrigin = r.pdsOrigin;
  } else {
    const resolvedDid = await resolveHandleToDid(input, fetchImpl);
    if (!resolvedDid)
      throw new Error(`resolveBlueskyIdentity: could not resolve handle to DID: ${input}`);
    const r = await resolveDidToPds(resolvedDid, fetchImpl);
    did = r.did;
    handle = input.includes('.') ? input : r.handle;
    pdsOrigin = r.pdsOrigin;
  }

  const { authorizationServers } = await fetchOAuthProtectedResourceMetadata(pdsOrigin, fetchImpl);
  const authServerOrigin = authorizationServers[0]!;
  return { did, handle, pdsOrigin, authServerOrigin };
}
