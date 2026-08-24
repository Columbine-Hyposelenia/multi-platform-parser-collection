import type { DpopKeypairJwk } from './types.js';

function base64UrlEncode(buf: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeJson(obj: unknown): string {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(obj)));
}

/**
 * WebCrypto `sign(ECDSA)` returns ASN.1 DER in browsers; some runtimes (e.g. Workers) return
 * raw IEEE P1363 R||S (64 bytes for P-256). Normalize to raw for JWT.
 */
export function ecdsaSignatureToRawP256(sig: Uint8Array): Uint8Array {
  if (sig.length === 64) {
    return sig;
  }
  return ecdsaDerSignatureToRawP256(sig);
}

/** Convert WebCrypto ECDSA DER signature to JOSE raw R||S (P-256 = 64 bytes). */
export function ecdsaDerSignatureToRawP256(der: Uint8Array): Uint8Array {
  let i = 0;
  if (der[i++] !== 0x30) throw new Error('Invalid ECDSA DER');
  let seqLen = der[i++]!;
  if (seqLen & 0x80) {
    const n = seqLen & 0x7f;
    seqLen = 0;
    for (let j = 0; j < n; j++) seqLen = (seqLen << 8) | der[i++]!;
  }
  if (der[i++] !== 0x02) throw new Error('Invalid ECDSA DER: expected r');
  const rLen = der[i++]!;
  let r = der.slice(i, i + rLen);
  i += rLen;
  if (der[i++] !== 0x02) throw new Error('Invalid ECDSA DER: expected s');
  const sLen = der[i++]!;
  let s = der.slice(i, i + sLen);
  if (r.length > 0 && r[0] === 0 && r.length > 32) r = r.slice(1);
  if (s.length > 0 && s[0] === 0 && s.length > 32) s = s.slice(1);
  if (r.length > 32 || s.length > 32) throw new Error('Invalid r/s length for P-256');
  const out = new Uint8Array(64);
  out.set(r, 32 - r.length);
  out.set(s, 64 - s.length);
  return out;
}

async function importDpopPrivateKey(privateJwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    { ...privateJwk, key_ops: ['sign'] },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/** RFC 7638 JWK thumbprint (SHA-256, base64url of digest of canonical member order). */
export async function jwkThumbprintS256(jwk: JsonWebKey): Promise<string> {
  const { kty, crv, x, y, e, n } = jwk;
  let payload: Record<string, string>;
  if (kty === 'EC' && crv && x && y) {
    payload = { crv, kty: 'EC', x, y };
  } else if (kty === 'RSA' && e && n) {
    payload = { e, kty: 'RSA', n };
  } else {
    throw new Error('jwkThumbprintS256: unsupported JWK for thumbprint');
  }
  const keys = Object.keys(payload).sort();
  const canonical = `{${keys.map(k => `"${k}":${JSON.stringify(payload[k])}`).join(',')}}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return base64UrlEncode(new Uint8Array(digest));
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return base64UrlEncode(new Uint8Array(digest));
}

export async function generateDpopKeypair(): Promise<DpopKeypairJwk> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify'
  ]);
  const publicJwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey;
  const privateJwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey;
  // Strip optional fields for stable storage
  const pub: JsonWebKey = {
    kty: publicJwk.kty,
    crv: publicJwk.crv,
    x: publicJwk.x,
    y: publicJwk.y
  };
  const priv: JsonWebKey = {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    d: privateJwk.d
  };
  return { publicJwk: pub, privateJwk: priv };
}

export type SignDpopProofParams = {
  keypair: DpopKeypairJwk;
  htm: string;
  htu: string;
  /** Seconds since epoch (default: now). */
  iat?: number;
  /** Random JWT ID. */
  jti?: string;
  nonce?: string;
  /** RFC 9449 §4.2: hash of access token when binding proof to token. */
  ath?: string;
};

export async function signDpopProof(params: SignDpopProofParams): Promise<string> {
  const { keypair, htm, htu } = params;
  const iat = params.iat ?? Math.floor(Date.now() / 1000);
  const jti = params.jti ?? base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));

  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk: keypair.publicJwk
  };

  const payload: Record<string, string | number> = {
    jti,
    iat,
    htm: htm.toUpperCase(),
    htu
  };
  if (params.nonce) payload.nonce = params.nonce;
  if (params.ath) payload.ath = params.ath;

  const headB64 = base64UrlEncodeJson(header);
  const payB64 = base64UrlEncodeJson(payload);
  const signingInput = `${headB64}.${payB64}`;

  const key = await importDpopPrivateKey(keypair.privateJwk);
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(signingInput)
    )
  );
  const sigRaw = ecdsaSignatureToRawP256(sigBytes);
  const sigB64 = base64UrlEncode(sigRaw);
  return `${signingInput}.${sigB64}`;
}

/** `ath` claim: BASE64URL(SHA256(access_token)) per RFC 9449. */
export async function dpopAthFromAccessToken(accessToken: string): Promise<string> {
  return sha256Base64Url(accessToken);
}
