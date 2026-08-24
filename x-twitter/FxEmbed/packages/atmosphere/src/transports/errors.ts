/** Base class for Atmosphere transport failures (public XRPC, proxy, relay, or auth). */
export class TransportError extends Error {
  readonly status: number;
  readonly body?: string;
  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = 'TransportError';
    this.status = status;
    this.body = body;
  }
}

export class NotFoundError extends TransportError {
  constructor(message = 'Not found', body?: string) {
    super(message, 404, body);
    this.name = 'NotFoundError';
  }
}

export class RateLimitedError extends TransportError {
  constructor(message = 'Rate limited', body?: string) {
    super(message, 429, body);
    this.name = 'RateLimitedError';
  }
}

export class AuthNotImplementedError extends Error {
  constructor(message = 'Authenticated transport is not implemented yet') {
    super(message);
    this.name = 'AuthNotImplementedError';
  }
}

export class NotImplementedError extends Error {
  constructor(message = 'Not implemented') {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/** Bluesky OAuth / DPoP / token failures for pattern-matching in apps (e.g. re-login on `refresh_invalid`). */
export type BlueskyAuthErrorKind =
  | 'nonce_required'
  | 'access_expired'
  | 'refresh_invalid'
  | 'scope_insufficient'
  | 'revoked'
  | 'network'
  | 'invalid_request';

export class BlueskyAuthError extends Error {
  readonly kind: BlueskyAuthErrorKind;
  readonly status?: number;
  readonly bodySnippet?: string;

  constructor(
    kind: BlueskyAuthErrorKind,
    message: string,
    opts?: { status?: number; body?: string }
  ) {
    super(message);
    this.name = 'BlueskyAuthError';
    this.kind = kind;
    this.status = opts?.status;
    this.bodySnippet = opts?.body?.slice(0, 500);
  }
}
