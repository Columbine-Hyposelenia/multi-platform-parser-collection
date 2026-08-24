import type { Env } from 'hono';
import type { OpenAPIHonoOptions } from '@hono/zod-openapi';
import { Constants } from '../../constants';

function formatZodIssues(issues: ReadonlyArray<{ path: unknown; message: string }>): string {
  return issues
    .map(issue => {
      const segments = Array.isArray(issue.path) ? issue.path : [];
      const path = segments.length ? segments.join('.') : 'request';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

/** Normalizes Zod OpenAPI route validation failures to `{ code: 400, message }`. */
export const apiOpenapiValidationHook: NonNullable<OpenAPIHonoOptions<Env>['defaultHook']> = (
  result,
  c
) => {
  if (result.success) {
    return;
  }
  const message = formatZodIssues(result.error.issues);
  for (const [header, value] of Object.entries(Constants.API_RESPONSE_HEADERS)) {
    c.header(header, value);
  }
  return c.json({ code: 400 as const, message }, 400);
};
