# Generated relay OpenAPI types

Run from the FxEmbed repo root (requires network):

```bash
npm run openapi:atmosphere
```

This writes `fxtwitter-paths.ts` and `fxbsky-paths.ts` from production `/2/openapi.json` hosts.
Use with `openapi-fetch` and `createRelayFetch` from `../proxy-relay.ts`.
