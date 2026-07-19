---
name: api-designer
description: >-
  Design clean, consistent, and practical APIs. Use whenever the user is designing a new API endpoint, reviewing API design, choosing between REST, GraphQL, or RPC, defining request/response schemas, handling errors, designing pagination, authentication, rate limiting, versioning, or discussing API contracts. Also use when the user says "should this be a POST or PUT", "how should I structure this endpoint", or when API design comes up in code review.
---

# API Designer

Help the user design APIs that are consistent, predictable, and pleasant to use.

## Core philosophy

An API is a contract. Every design decision affects every consumer — your future self, your teammates, and external developers. Consistency and predictability matter more than cleverness.

## REST-first default

Start with REST unless there's a clear reason not to. REST is widely understood, tooling is mature, and the constraints (resources, methods, status codes) provide a shared vocabulary.

Consider GraphQL when:
- Clients need flexible, client-driven data fetching
- You have many different clients (mobile, web, third-party) with different data needs
- The API surface is large and versioning REST endpoints becomes painful

Consider RPC (gRPC, tRPC) when:
- You need strict typed contracts and code generation
- Performance and binary serialization matter
- You're in a monorepo where client and server share types

## Resource design

### URL structure
```
POST   /resources          # Create
GET    /resources          # List
GET    /resources/:id      # Read
PATCH  /resources/:id      # Partial update
PUT    /resources/:id      # Full replace
DELETE /resources/:id      # Delete
```

- Use plural nouns for collections (`/users`, not `/user` or `/getUsers`)
- Nest resources to express hierarchy (`/users/:id/posts`)
- Avoid deep nesting — at most 2 levels deep. Flatten with query params if needed
- Use kebab-case for multi-word resources (`/order-items`)

### Naming conventions

- Nouns for resources, not verbs (`/orders`, not `/getOrders` or `/createOrder`)
- Use sub-resources for actions that don't fit CRUD: `/orders/:id/cancel`
- Query parameters for filtering, sorting, and pagination — not path segments
- Be consistent: if you use `userId` as a query param in one place, use it everywhere

## Request design

### HTTP methods
- **GET**: safe, idempotent, cacheable
- **POST**: not safe, not idempotent (creates a new resource)
- **PUT**: not safe, idempotent (full replacement)
- **PATCH**: not safe, not idempotent (partial update)
- **DELETE**: not safe, idempotent

Use POST for operations that aren't CRUD (compute, transform, trigger).

### Body format
- Accept JSON by default (Content-Type: application/json)
- Support standard date formats (ISO 8601)
- Use snake_case or camelCase consistently — match the ecosystem
- Use enums for constrained string values
- Use booleans for flags, not strings

## Response design

### Status codes
| Code | When to use |
|---|---|
| 200 | Success with body (GET, PATCH) |
| 201 | Created (POST) |
| 204 | Success, no body (DELETE) |
| 400 | Bad request — invalid input |
| 401 | Unauthenticated |
| 403 | Unauthorized — authenticated but not allowed |
| 404 | Resource not found |
| 409 | Conflict — resource state prevents the operation |
| 422 | Unprocessable entity — semantic validation failure |
| 429 | Rate limited |
| 500 | Internal server error (don't expose details) |

### Error responses

Use a consistent error body:
```json
{
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "Only 3 items available, requested 5",
    "details": {
      "available": 3,
      "requested": 5
    }
  }
}
```

- `code` — machine-readable error identifier
- `message` — human-readable explanation
- `details` — optional structured data for the client to handle

Don't leak stack traces, server paths, or internal state in error responses.

### Pagination

Use cursor-based pagination for lists:
```json
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true
  }
}
```

Request with: `GET /resources?cursor=...&limit=20`

Cursor pagination is stable (new items don't shift pages) and works better at scale than offset-based. Use offset-based only for admin UIs where users need to jump to specific pages.

## Versioning

Version via URL prefix (`/v1/resources`) or header (`Accept: application/vnd.api+json;version=1`). URL prefix is simpler and more visible.

Version when you're making a breaking change (removing fields, changing types, changing behavior). Don't version for additive changes — add new fields, deprecate old ones.

## Security

- Authentication via Authorization header (Bearer tokens)
- Rate limiting via 429 responses with Retry-After header
- Input validation on every field — never trust the client
- Idempotency keys for mutation endpoints (`Idempotency-Key` header)
- CORS configuration — explicit, not wildcard

## Documentation

Every endpoint should document:
- Purpose — what does this do?
- Request — method, path, headers, body schema
- Response — status codes, body schema, error scenarios
- Example — a complete request/response pair

Use OpenAPI/Swagger for specification. It's the industry standard and generates client libraries, docs, and test fixtures.
