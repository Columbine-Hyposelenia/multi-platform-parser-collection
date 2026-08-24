import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * zod-to-openapi copies `.openapi({ description })` onto both the Parameter object
 * and `schema.description`. Doc renderers (e.g. starlight-openapi) show both, so we
 * drop the redundant schema copy when it matches the parameter description.
 */
function dedupeOpenApiParameterDescriptions(document: Record<string, unknown>): void {
  const paths = document.paths;
  if (!paths || typeof paths !== 'object') return;

  for (const pathItem of Object.values(paths as Record<string, unknown>)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    const item = pathItem as Record<string, unknown>;

    if (Array.isArray(item.parameters)) {
      dedupeParamList(item.parameters);
    }

    for (const [key, value] of Object.entries(item)) {
      if (key === 'parameters' || key.startsWith('x-')) continue;
      if (!value || typeof value !== 'object') continue;
      const op = value as Record<string, unknown>;
      if (Array.isArray(op.parameters)) {
        dedupeParamList(op.parameters);
      }
    }
  }
}

function dedupeParamList(parameters: unknown[]): void {
  for (const p of parameters) {
    if (!p || typeof p !== 'object') continue;
    const param = p as Record<string, unknown>;
    if ('$ref' in param) continue;
    const schema = param.schema;
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) continue;
    const s = schema as Record<string, unknown>;
    if (typeof s.description !== 'string') continue;
    if (param.description === s.description) {
      delete s.description;
    }
  }
}

/** Same behavior as `OpenAPIHono#doc`, plus parameter description deduplication. */
export function registerOpenApiJsonRoute(
  app: OpenAPIHono,
  path: string,
  configureObject: Parameters<OpenAPIHono['doc']>[1],
  configureGenerator?: Parameters<OpenAPIHono['doc']>[2]
): void {
  app.get(path, c => {
    const objectConfig =
      typeof configureObject === 'function' ? configureObject(c) : configureObject;
    const generatorConfig =
      typeof configureGenerator === 'function' ? configureGenerator(c) : configureGenerator;
    try {
      const document = app.getOpenAPIDocument(objectConfig, generatorConfig);
      dedupeOpenApiParameterDescriptions(document as Record<string, unknown>);
      return c.json(document);
    } catch (e) {
      return c.json(e, 500);
    }
  });
}
