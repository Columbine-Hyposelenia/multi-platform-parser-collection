import type { APIUser } from '../../types/api-schemas.js';

/** DID for the official `bsky.app` account (`alsoKnownAs` includes `at://bsky.app`). */
export const BLUESKY_APP_OFFICIAL_ISSUER_DID = 'did:plc:z72i7hdynmk6r22z27h6tvur';

type BlueskyVerificationViewSubset = {
  issuer?: string;
  isValid?: boolean;
};

type BlueskyVerificationStateSubset = {
  verifiedStatus?: string;
  verifications?: BlueskyVerificationViewSubset[];
};

const validIssuers = (state: BlueskyVerificationStateSubset | undefined): string[] => {
  const list = state?.verifications;
  if (!list?.length) return [];
  return list.filter(v => v.isValid === true && typeof v.issuer === 'string').map(v => v.issuer!);
};

/**
 * Maps `app.bsky.actor.defs#verificationState` into API `verification` for FxBluesky.
 * Uses `verified_by` (`bsky.app`, another issuer DID, or `trusted_verifier`) instead of X-style `type`.
 */
export const blueskyVerificationToApiUserVerification = (
  state: BlueskyVerificationStateSubset | undefined
): NonNullable<APIUser['verification']> | undefined => {
  if (state?.verifiedStatus !== 'valid') return undefined;

  const issuers = validIssuers(state);
  const official = issuers.find(i => i === BLUESKY_APP_OFFICIAL_ISSUER_DID);
  if (official) {
    return {
      verified: true,
      type: null,
      verified_at: null,
      verified_by: 'bsky.app'
    };
  }
  if (issuers[0]) {
    return {
      verified: true,
      type: null,
      verified_at: null,
      verified_by: issuers[0]
    };
  }
  return {
    verified: true,
    type: null,
    verified_at: null,
    verified_by: 'trusted_verifier'
  };
};
