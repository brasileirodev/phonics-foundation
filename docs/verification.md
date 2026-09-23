# Local verification

Completed September 23, 2026, on Windows with Node 24.16.0, pnpm 10.34.5 and Docker Engine 29.5.2. Commands below run from the repository root. On this host the bundled plain pnpm executable reports 11.19.0, so verification used `npx --yes pnpm@10.34.5`.

| Check                         | Result            | Evidence                                                                                                                         |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Approved prompt preserved     | Passed            | Source and docs/setup-prompt.txt SHA-256: C4532C8F2DCB6D75FBEEF6C0A7F0433A9FD126FE54132BB3512D69CD2437445C                       |
| Dependency installation       | Passed            | Pinned pnpm installation completed; final `install --frozen-lockfile` reported lockfile up to date                               |
| Lint and boundaries           | Passed            | `pnpm lint`; no framework/persistence imports in core; shared DTOs standalone                                                    |
| Type checking                 | Passed            | All three workspace packages; Turbo 4 successful tasks including shared build                                                    |
| Formatting                    | Passed            | `pnpm format:check`; canonical prompt excluded from formatting                                                                   |
| Backend unit tests            | Passed            | 5 tests, no failures or skips                                                                                                    |
| Frontend/UI/API-client tests  | Passed            | 8 tests in 2 files, no failures                                                                                                  |
| Real database/API integration | Passed            | 1 scenario with PostgreSQL and DynamoDB Local, no skips; final scenario duration 12.35 seconds                                   |
| Production builds             | Passed            | Shared, Nest and Vite builds; Turbo 3 successful tasks                                                                           |
| Shared resolution             | Passed            | Backend/frontend imports compile against built @phonics/shared and frontend production bundle runs                               |
| PostgreSQL migrations         | Passed            | First deploy applied initial migration; second deploy and container initialization reported no pending migrations                |
| Seed/table repeatability      | Passed            | Integration invoked each twice; Compose initialization also completed                                                            |
| Ordered SAPO retrieval        | Passed            | 7 steps at positions 0–6; direct repository and real HTTP assertions                                                             |
| New-session response          | Passed            | HTTP returns `{"progress":null}`; regression covered by API integration and frontend client tests                                |
| Progress persistence          | Passed            | Direct adapter and HTTP write/read, session isolation, Nest recreation                                                           |
| Compose configuration         | Passed            | `docker compose config --quiet`                                                                                                  |
| Application images            | Passed            | Both Dockerfiles built with frozen lockfile via `node scripts/docker-build.mjs`                                                  |
| Complete stack readiness      | Passed            | `docker compose up -d --wait`; initializer exited 0, PostgreSQL/backend/frontend/readiness companion healthy                     |
| Container restart persistence | Passed            | `node scripts/verify-stack.mjs` restarted backend, PostgreSQL and DynamoDB; saved progress and lesson retained                   |
| Browser connectivity          | Passed            | Real browser loaded SAPO, saved 1 of 7 steps, displayed simulated evaluation and read saved count after database restarts/reload |
| Responsive/i18n preview       | Passed            | Browser inspected at 390×844 and 1280×900; English/Portuguese switching; mobile document had no horizontal overflow              |
| Local secret exclusion        | Passed            | Both .env files ignored by Git; build context excludes .env variants                                                             |
| VS Code                       | Passed            | `code .` completed successfully at user's request                                                                                |
| Hosted CI execution           | Pending           | Workflow provided; no remote repository push or GitHub Actions run requested                                                     |
| Optional MUI code generator   | Unavailable       | MCP requires MUI_RECIPES_API_KEY; MUI documentation MCP succeeded and starter was implemented directly                           |
| AWS infrastructure            | Deferred by scope | No resources provisioned or cloud charges incurred                                                                               |

## Failures found and corrected

- The bundled pnpm 11 command did not honor pnpm 10 build-script settings. Reinstalled with the exact pinned pnpm version; frozen installation passes.
- Material UI 9 removed direct layout props. Moved those styles into sx and verified type checking and rendering.
- Dynamoose instances expose Table, not model. Models are now bound to a configured instance's table; real database round trips pass.
- Windows BuildKit rejected the accented workspace path in a gRPC session header. The checked-in tar-stream build helper uses a temporary CLI working directory and both images build successfully.
- Vitest fork workers timed out on this Windows host. A bounded thread pool runs all frontend tests successfully.
- Returning a bare null from Nest produced an empty HTTP body for a new session. Introduced the shared ProgressResponse envelope, added regression assertions and verified a new browser session.

No unresolved blocking implementation or local verification failures remain. Vite reports a non-blocking approximately 519 kB minified entry-bundle advisory (about 162 kB gzip). Code splitting can follow when the learning/audio screens are implemented.

## Reproduction and running state

The full stack was left running. Open http://localhost:3000; readiness is http://localhost:4000/ready. VS Code is open at the project root.

```sh
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm db:init
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm format:check
pnpm stack:up
node scripts/verify-stack.mjs
```

Local raw command logs are in ignored .log files: install-final.log, lint-final.log, typecheck-final.log, tests-final.log, integration-final.log, build-final.log, format-check-final.log, docker-build-final.log, stack-final.log and stack-verification.log. They are execution evidence, not required source files.

The GitHub Actions workflow executes installation, database startup, migration repeatability, initialization, lint, formatting, types, unit/integration tests and builds. Hosted execution remains unverified until the project is pushed and CI runs.
