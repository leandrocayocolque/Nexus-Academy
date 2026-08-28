# NEXUS Backend

Express + Prisma scaffold for the NEXUS API.

## Quick path

1. Copy `.env.example` to `.env` and fill the required values.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Start development with `npm run dev`.

## Current scope

This is an initial scaffold only. Routes, services, repositories, providers, and tests are placeholders so future work can add behavior without changing the project shape.

## Structure

| Path | Purpose |
|------|---------|
| `prisma/` | Database schema and future seed script. |
| `src/config/` | Environment, security, CORS, logger, Prisma, and Swagger setup. |
| `src/modules/` | Feature modules with route/controller/service/repository/schema boundaries. |
| `src/providers/` | Replaceable external service adapters. |
| `src/shared/` | Shared errors, middleware, constants, utilities, and response helpers. |
| `tests/` | Future unit, integration, API, and factory tests. |

## Health check

`GET /api/health` returns a basic API status response.
