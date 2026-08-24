/**
 * Fetches OpenAPI specs from FxEmbed API endpoints and writes them to docs/specs/.
 *
 * Usage:
 *   node scripts/extract-openapi.mjs                    # fetch from production
 *   node scripts/extract-openapi.mjs --local 8787       # local wrangler dev (omit port → 8787)
 *   node scripts/extract-openapi.mjs --placeholder      # write minimal placeholder specs
 *
 * Local mode sends Host headers so the worker picks the API realm (same as production).
 * Override hosts if your .env uses different API hostnames:
 *   DOCS_OPENAPI_LOCAL_HOST_FXTWITTER=api.fxtwitter.com
 *   DOCS_OPENAPI_LOCAL_HOST_FXBLUESKY=api.fxbsky.app
 *
 * Prerequisite: run the worker, e.g. `npx wrangler dev --local` from the repo root.
 */

import http from 'node:http';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specsDir = join(__dirname, '..', 'specs');

const SCHEMA_REF_PREFIX = '#/components/schemas/';

/**
 * starlight-openapi detects recursive schemas via object-reference equality on the
 * schema object itself (see `SchemaObjectObjectProperties.astro`). Self-references
 * wrapped inside `anyOf`/`oneOf`/`allOf` are NOT detected and cause the prerender to
 * blow the stack with "Maximum call stack size exceeded".
 *
 * To keep rich unions (e.g. `quote: APITwitterStatus | APIStatusTombstone`) visible
 * in the docs, we walk each named schema and replace only the self-referencing arm
 * of a union with a safe inline placeholder that still communicates the shape.
 */
function sanitizeSelfReferentialUnions(spec) {
  const schemas = spec?.components?.schemas;
  if (!schemas || typeof schemas !== 'object') return spec;

  for (const [schemaName, schema] of Object.entries(schemas)) {
    const selfRef = SCHEMA_REF_PREFIX + schemaName;
    walk(schema, selfRef, schemaName);
  }

  return spec;

  function walk(node, selfRef, schemaName) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child, selfRef, schemaName);
      return;
    }
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
      const arr = node[key];
      if (!Array.isArray(arr)) continue;
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item && typeof item === 'object' && item.$ref === selfRef) {
          arr[i] = {
            type: 'object',
            title: `${schemaName} (recursive)`,
            description: `Recursive reference — same shape as \`${schemaName}\`.`
          };
        }
      }
    }
    for (const value of Object.values(node)) walk(value, selfRef, schemaName);
  }
}

const PRODUCTION_ENDPOINTS = [
  {
    name: 'fxtwitter-openapi.json',
    url: 'https://api.fxtwitter.com/2/openapi.json',
    localHostHeader: process.env.DOCS_OPENAPI_LOCAL_HOST_FXTWITTER?.trim() || 'api.fxtwitter.com'
  },
  {
    name: 'fxbluesky-openapi.json',
    url: 'https://api.fxbsky.app/2/openapi.json',
    localHostHeader: process.env.DOCS_OPENAPI_LOCAL_HOST_FXBLUESKY?.trim() || 'api.fxbsky.app'
  }
];

function makePlaceholder(title, description) {
  return {
    openapi: '3.0.0',
    info: { title, version: '2.0.0', description },
    paths: {},
    components: {}
  };
}

/** Local dev: Node http so Host is honored (undici fetch may override Host for http URLs). */
function fetchLocalOpenApi(port, hostHeader) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: Number(port),
        path: '/2/openapi.json',
        method: 'GET',
        timeout: 30_000,
        headers: {
          'Host': hostHeader,
          'User-Agent': 'FxEmbed-Docs-Builder/1.0'
        }
      },
      res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              reject(new Error(`Invalid JSON: ${msg}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchSpec(endpoint, localPort) {
  if (localPort) {
    return fetchLocalOpenApi(localPort, endpoint.localHostHeader);
  }
  const res = await fetch(endpoint.url, {
    headers: { 'User-Agent': 'FxEmbed-Docs-Builder/1.0' }
  });
  if (!res.ok) {
    throw new Error(`${endpoint.url}: HTTP ${res.status}`);
  }
  return res.json();
}

function writeSpec(path, spec) {
  sanitizeSelfReferentialUnions(spec);
  writeFileSync(path, JSON.stringify(spec, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const usePlaceholder = args.includes('--placeholder');
  const sanitizeOnly = args.includes('--sanitize');
  const localIdx = args.indexOf('--local');
  const localPort = localIdx !== -1 ? args[localIdx + 1] || '8787' : null;

  mkdirSync(specsDir, { recursive: true });

  if (sanitizeOnly) {
    console.log('Sanitizing existing specs in place...');
    for (const endpoint of PRODUCTION_ENDPOINTS) {
      const path = join(specsDir, endpoint.name);
      try {
        const spec = JSON.parse(readFileSync(path, 'utf8'));
        writeSpec(path, spec);
        console.log(`  ✓ ${endpoint.name}`);
      } catch (err) {
        console.log(`  ✗ ${endpoint.name}: ${err.message}`);
      }
    }
    return;
  }

  if (usePlaceholder) {
    console.log('Writing placeholder specs...');
    const placeholders = [
      { name: 'fxtwitter-openapi.json', title: 'FxTwitter API', desc: 'FxTwitter API v2' },
      { name: 'fxbluesky-openapi.json', title: 'FxBluesky API', desc: 'FxBluesky API v2' }
    ];
    for (const p of placeholders) {
      const path = join(specsDir, p.name);
      writeSpec(path, makePlaceholder(p.title, p.desc));
      console.log(`  → ${path}`);
    }
    return;
  }

  for (const endpoint of PRODUCTION_ENDPOINTS) {
    const label = localPort
      ? `http://127.0.0.1:${localPort}/2/openapi.json (Host: ${endpoint.localHostHeader})`
      : endpoint.url;
    process.stdout.write(`Fetching ${endpoint.name} from ${label}...`);
    try {
      const spec = await fetchSpec(endpoint, localPort);
      const path = join(specsDir, endpoint.name);
      writeSpec(path, spec);
      console.log(` ✓`);
    } catch (err) {
      console.log(` ✗ ${err.message}`);
      console.log(`  → Writing placeholder for ${endpoint.name}`);
      const path = join(specsDir, endpoint.name);
      writeSpec(path, makePlaceholder(endpoint.name.replace(/-openapi\.json$/, ''), ''));
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
