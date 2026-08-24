import { getRuntimeKey } from 'hono/adapter';

const RUNTIME_LABELS: Partial<Record<string, string>> = {
  'workerd': 'Cloudflare Workers',
  'edge-light': 'Vercel Edge',
  'bun': 'Bun',
  'node': 'Node.js',
  'deno': 'Deno',
  'fastly': 'Fastly Compute'
};

export const formatRuntime = (): string => {
  const key = getRuntimeKey();
  const label = RUNTIME_LABELS[key];
  return label ?? key;
};
