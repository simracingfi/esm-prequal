---
id: TASK-1
title: >-
  Generate OpenAPI spec from source annotations and serve developer portal at
  API root
status: To Do
assignee: []
created_date: '2026-05-08 07:07'
labels:
  - result-server
  - dx
  - api-docs
dependencies: []
references:
  - packages/result-server/src/index.ts
  - packages/result-server/src/routes/laptimes.ts
  - packages/result-server/src/routes/competitions.ts
  - packages/result-server/src/routes/standings.ts
  - packages/result-server/src/routes/drivers.ts
  - packages/result-server/src/types.ts
  - packages/result-server/wrangler.toml
  - packages/result-server/package.json
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

API definition for `result-server` should live as annotations in the source code, not in a separate manually maintained document. An OpenAPI spec must be generated from those annotations, and a developer portal must be built from that spec and served at the API root (`/`) when the worker is deployed with `wrangler deploy`. The existing README.md API section may be removed or reduced once the portal is live.

## Current State

- Framework: **Hono v4.7.0** running on **Cloudflare Workers**
- Validation: **Zod v3.24.0** — schemas already defined inline in route files
- Deployment: `wrangler deploy` (wrangler v4.0.0, compatibility date `2025-12-01`)
- API root (`/`) serves a plain-text health check response
- No OpenAPI tooling present; API reference is hand-maintained in `README.md`
- Five endpoints: `POST /api/laptimes` (X-API-Key auth), `GET /api/laptimes`, `GET /api/competitions`, `GET /api/standings`, `GET /api/drivers`

## Planned Changes

### 1. Add dependencies

Add to `packages/result-server/package.json`:

- `@hono/zod-openapi` — drop-in `OpenAPIHono` wrapper that integrates Zod schemas with OpenAPI 3.1 route metadata; replaces the bare `Hono` constructor
- `@scalar/hono-api-reference` — serves an interactive developer portal as a static HTML page from a single middleware call; Scalar has no external CDN dependency at runtime

### 2. Refactor `src/index.ts`

Replace `new Hono<Env>()` with `new OpenAPIHono<Env>()` from `@hono/zod-openapi`.

Add the OpenAPI document configuration (title, version, security scheme for `X-API-Key`):

```ts
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'ESM Prequal Result Server', version: '1.0.0' },
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
  },
});
```

Replace the current root health-check route with the developer portal:

```ts
app.get('/', apiReference({ spec: { url: '/openapi.json' } }));
```

Keep a `/health` route (or equivalent) if a plain-text liveness check is needed elsewhere.

### 3. Convert route files to `createRoute` / `.openapi()` pattern

For each route file (`src/routes/laptimes.ts`, `competitions.ts`, `standings.ts`, `drivers.ts`):

- Replace `.get(path, handler)` / `.post(path, handler)` calls with the two-step pattern:
  1. `const route = createRoute({ method, path, request: { ... }, responses: { ... } })` — declares the contract using existing Zod schemas
  2. `router.openapi(route, handler)` — registers the route with full type inference

- Promote inline Zod schemas to named exports in `src/types.ts` (or alongside their route) so they can be referenced from both the route definition and any future client-generation step.

- Document authentication on `POST /api/laptimes`: add `security: [{ ApiKeyAuth: [] }]` to that route definition.

- Document query parameters (`competition` on `/api/laptimes` and `/api/standings`) using Zod-validated request schemas.

### 4. Build-time spec generation

The spec is available at runtime from `/openapi.json` with no extra build step required — Cloudflare Workers execute code, so spec generation is lazy and always fresh.

### 5. No wrangler.toml changes needed

`wrangler deploy` bundles the entire Worker including Hono routes and the Scalar/Swagger UI asset. No additional bindings, static assets, or deploy steps are required. The portal is served dynamically by the Worker itself.

## File Change Summary

| File | Change |
|------|--------|
| `package.json` | Add `@hono/zod-openapi`, `@scalar/hono-api-reference` (or `@hono/swagger-ui`) |
| `src/index.ts` | Switch to `OpenAPIHono`, add `/openapi.json` doc route, replace `/` with portal |
| `src/types.ts` | Export named Zod schemas used in route definitions |
| `src/routes/laptimes.ts` | Convert to `createRoute` + `.openapi()`, add auth annotation |
| `src/routes/competitions.ts` | Convert to `createRoute` + `.openapi()` |
| `src/routes/standings.ts` | Convert to `createRoute` + `.openapi()` |
| `src/routes/drivers.ts` | Convert to `createRoute` + `.openapi()` |
| `scripts/generate-openapi.ts` | (optional) static spec export script |
| `README.md` | Remove or reduce the hand-maintained API reference section |

## Constraints

- Must not change the public API surface (paths, methods, request/response shapes)
- `wrangler dev` and `wrangler deploy` remain the only commands needed to develop and ship
- The X-API-Key authentication requirement for `POST /api/laptimes` must be reflected in the spec
- No external CDN dependencies at runtime (Scalar embeds its assets; verify this holds)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET / returns an interactive developer portal HTML page when the worker is deployed or running under wrangler dev
- [ ] #2 GET /openapi.json returns a valid OpenAPI 3.1 document containing all five endpoints (POST /api/laptimes, GET /api/laptimes, GET /api/competitions, GET /api/standings, GET /api/drivers)
- [ ] #3 All request schemas (body for POST, query params for GET) are reflected accurately in the spec
- [ ] #4 X-API-Key security requirement is declared on POST /api/laptimes in the spec
- [ ] #5 The OpenAPI spec is derived from source annotations only — no manually maintained YAML or JSON spec file is required for the portal to work
- [ ] #6 wrangler deploy deploys the portal with no additional manual steps
- [ ] #7 Existing Zod validation behaviour is preserved (no regression on request validation)
<!-- AC:END -->
