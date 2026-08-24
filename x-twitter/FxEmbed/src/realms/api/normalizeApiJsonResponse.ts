import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';

function fallbackHttpStatus(allowed: readonly number[]): number {
  if (allowed.includes(500)) return 500;
  const clientError = allowed.filter(c => c >= 400);
  if (clientError.length > 0) return Math.max(...clientError);
  return 500;
}

/**
 * Coerce provider envelope `code` to statuses declared on the OpenAPI route.
 * Logs when the raw value is missing or not in `allowed`; syncs JSON `code` when remapping.
 */
export function normalizeApiJsonResponse<
  const A extends readonly number[],
  T extends { code: number }
>(body: T, allowed: A, context: string): { httpStatus: A[number]; payload: T } {
  const raw = body.code;
  const code = typeof raw === 'number' && Number.isFinite(raw) ? Math.trunc(raw) : Number.NaN;
  if (allowed.includes(code as A[number])) {
    return { httpStatus: code as A[number], payload: body };
  }
  const fb = fallbackHttpStatus(allowed) as A[number];
  console.warn(
    `[api] response envelope code ${String(raw)} not in OpenAPI set [${allowed.join(', ')}] for ${context}; using HTTP ${fb}`
  );
  return { httpStatus: fb, payload: { ...body, code: fb } as T };
}

/**
 * After {@link normalizeApiJsonResponse}, response bodies still use the shared FxTwitter-style
 * envelope for every HTTP status; assert the handler return so TypeScript accepts it (OpenAPI
 * may type400 as a different schema than 200/404/500).
 */
export function jsonAfterNormalize<R extends RouteConfig>(
  c: Context,
  payload: unknown,
  httpStatus: number
): Awaited<ReturnType<RouteHandler<R>>> {
  return c.json(payload, httpStatus as ContentfulStatusCode) as unknown as Awaited<
    ReturnType<RouteHandler<R>>
  >;
}
