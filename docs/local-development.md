# Phonics foundation

A local, runnable foundation for a Brazilian Portuguese phonics activity. The responsive React page demonstrates real lesson retrieval, anonymous progress storage, and an explicitly simulated evaluation. The complete learning interface, reference recordings, microphone capture and playback are subsequent work. No cloud resources are created.

## Architecture

```text
apps/frontend       React / Vite / Material UI, English and Portuguese
apps/backend/src
  domain            Plain TypeScript lesson/progress models and rules
  application       Use cases and repository/evaluation ports
  adapters/http     Nest controllers, transport validation, error mapping
  adapters/persistence/postgres  Prisma mapping and idempotent seed
  adapters/persistence/dynamo    Dynamoose mapping and table initialization
  adapters/evaluation           Deterministic simulated evaluator
  composition       Configuration, Nest tokens and provider factories
packages/shared     Browser-compatible API DTOs only
docs/setup-prompt.txt  Exact approved setup contract
```

Dependency direction is adapters → application → domain. The composition root selects concrete adapters through explicit injection tokens. The core imports no Nest, Prisma, Dynamoose, shared transport DTOs, or environment configuration. HTTP adapters map the structurally compatible core results to shared contracts. ORM-generated types stay inside persistence adapters. The boundary checker runs with lint.

PostgreSQL owns lessons and ordered steps. DynamoDB owns progress, with partition key `sessionId` and sort key `lessonId`. Progress refers to the lesson by its application identifier; there is no cross-database transaction. Saving validates that the lesson exists and the completed count is within its step count. A save replaces the count (including an explicit reset); concurrent writes are last-write-wins. GET returns JSON `{ "progress": null }` for a new session and `{ "progress": { ... } }` for saved progress.

The anonymous UUID is stored in browser localStorage. It is a local demonstration identifier, not authentication. Audio is not uploaded or stored. The seed uses null reference-audio URLs until real recordings exist. Future recordings remain temporarily in browser memory.

## Prerequisites

- Node.js 24 LTS.
- pnpm **10.34.5** (`npm install -g pnpm@10.34.5`, or prefix commands with `npx --yes pnpm@10.34.5`).
- Docker Desktop with Linux containers / Docker Compose v2.
- Free host ports 3000, 4000, 5433 and 8000.

Dependencies are locked in `pnpm-lock.yaml`. Prisma 7 uses the PostgreSQL driver adapter and generated client in the persistence directory. TypeScript 5.9 and Nest 11 are retained as compatible stable versions. Nest decorators are compiled by TypeScript before Node's native backend test runner executes them. Frontend tests use Vitest and jsdom.

## Local development

From the repository root, copy `apps/backend/.env.example` to `apps/backend/.env` and `apps/frontend/.env.example` to `apps/frontend/.env`. In PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm --filter @phonics/shared build
pnpm db:seed
pnpm db:init
pnpm dev
```

Only copy examples on first setup; do not overwrite your own local configuration. The backend validates environment variables at startup without exposing their values. Local .env files are ignored. Only `VITE_API_URL` is public frontend configuration. Vite embeds it at build time; rebuild after changing it.

The bundled Codex pnpm wrapper may run a different major version. If `pnpm --version` is not 10.34.5, use `npx --yes pnpm@10.34.5` in place of `pnpm`.

## Entire stack in Docker

```sh
pnpm stack:up
docker compose ps
pnpm stack:down
```

The stack command builds both applications, then Compose waits for PostgreSQL and DynamoDB readiness, runs migrations/seed/table initialization in a one-shot container, and starts the backend and frontend. The build helper streams a tar context from a temporary working directory to avoid Docker Desktop's non-ASCII Windows path error. It requires the standard tar command included with Windows, macOS and Linux. Direct `docker compose up -d --build --wait` also works on unaffected paths. A lightweight readiness companion probes DynamoDB Local because its image lacks a convenient HTTP probe. Backend readiness checks both storage adapters and the seeded lesson. Application and database ports bind to localhost only.

| Service        | Host/browser                                              | Container network                                        |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| Frontend       | http://localhost:3000                                     | http://frontend:80                                       |
| Backend        | http://localhost:4000                                     | http://backend:4000                                      |
| PostgreSQL     | postgresql://phonics:phonics_local@localhost:5433/phonics | postgresql://phonics:phonics_local@postgres:5432/phonics |
| DynamoDB Local | http://localhost:8000                                     | http://dynamodb:8000                                     |

The browser uses the host backend URL even when frontend files are served from Docker. The Compose demo credentials are local-only values. Do not reuse this configuration for deployment.

To switch from the complete stack to host development, stop the containers occupying application ports:

```sh
docker compose stop frontend backend
pnpm dev
```

## API demonstration

| Method | Path                                  | Result                                                              |
| ------ | ------------------------------------- | ------------------------------------------------------------------- |
| GET    | /health                               | Process health                                                      |
| GET    | /ready                                | Seeded lesson and progress storage readiness                        |
| GET    | /lessons/sapo                         | SAPO with seven ordered steps                                       |
| GET    | /sessions/:uuid/lessons/sapo/progress | JSON envelope with saved progress or null                           |
| PUT    | /sessions/:uuid/lessons/sapo/progress | JSON body: `{"completedSteps":1}`                                   |
| POST   | /lessons/sapo/evaluation              | `{"success":true,"simulated":true,"provider":"deterministic-mock"}` |

Session IDs must be UUIDs. Counts must be integers from zero to the lesson's step count. Unexpected body properties are rejected. Application errors use 400/404/503 and a safe `{code,message}` body.

## Data lifecycle

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:init
# Create a future migration after editing the schema:
pnpm --filter @phonics/backend exec prisma migrate dev --name describe_change
```

Migrate deploy is repeatable. The transactional seed upserts SAPO and replaces only that lesson's ordered steps; IDs and content stay stable. Table initialization checks existence and waits for ACTIVE, and can be repeated. Initialization is separate from normal application startup. Progress survives application/container restarts in the named `phonics_dynamodb-data` volume; PostgreSQL uses `phonics_postgres-data`.

Stop without deleting data: `docker compose down`.

**Delete all local lesson and progress data:** `docker compose down --volumes`. Then run `pnpm stack:up` or the database initialization sequence again. This reset is intentionally manual.

## Verification

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
docker compose config --quiet
# With the complete container stack running (restarts this project's services):
node scripts/verify-stack.mjs
```

Unit tests use in-memory ports and exercise domain rules, missing lessons, session isolation and simulated evaluation. UI tests cover loading/success/error/retry, saving, error feedback and Portuguese resources. API client tests check requests and session IDs. Integration tests require both local databases and applied migrations; they repeat seed/table initialization, check real adapter round trips, HTTP validation/CORS and read progress after closing and recreating the Nest application.

CI uses GitHub Actions with both databases started through this same Compose configuration. Integration tests never silently skip missing prerequisites. Local verification evidence is recorded in `docs/verification.md`.

## Adapter replacement and later AWS work

Changing a repository implementation requires implementing its application port and updating the composition provider. Keep database query/result/error mapping in the adapter. Schema/data migrations remain the responsibility of the adapter owner, with backward-compatible rollout plans when lessons change. Session progress counts refer to a particular step sequence; lesson versioning or progress migration is required before editing published sequences.

Future targets are **Aurora PostgreSQL-Compatible** and **Amazon DynamoDB**. A later infrastructure phase must select region, networking and deployment service; configure TLS, private database access, IAM roles instead of local keys, secrets management, table provisioning, backups/retention, and migration execution. Replace the explicit local DynamoDB endpoint/credentials configuration with an AWS credential-provider chain and provision tables through infrastructure code. Add authentication/access controls if sessions become sensitive, monitoring, request limits and production readiness checks.

Before provisioning, estimate Aurora's minimum cost against the **BRL 50 total budget**, choose an affordable deployment plan, and set budget alerts. Nothing here incurs AWS charges. Real evaluation requires a new service adapter and explicit non-simulated result contracts. Real audio requires licensed reference assets, microphone permission UX and browser-memory lifecycle handling.

## Documentation consulted

- Context7: Prisma 7 configuration/driver adapter, Dynamoose local instances/table lifecycle, Vitest React test setup.
- [Material UI installation](https://mui.com/material-ui/getting-started/installation/), Stack and Alert documentation via Material UI MCP. Its optional code generator was unavailable because `MUI_RECIPES_API_KEY` was not configured.
- [Nest setup](https://docs.nestjs.com/first-steps) and [Vite setup](https://vite.dev/guide/).

The local fullstack setup skill was adapted to the approved React/Vite choice and this small architecture; its hardcoded Next.js generator was not run. The canonical prompt is preserved byte-for-byte.
