/**
 * Proxy-relay: typed client over another FxEmbed host’s `/2` OpenAPI (e.g. api.fxtwitter.com).
 *
 * Generate path types (optional, requires network or a local `openapi.json`):
 *
 * ```bash
 * npm run openapi:atmosphere
 * ```
 *
 * Then wrap with `openapi-fetch` + {@link createRelayFetch}.
 */
export type RelayNotGenerated = {
  _note: 'OpenAPI types are generated on demand; see generated/README.md';
};

export { createRelayFetch, type RelayFetchOptions } from './proxy-relay.js';
