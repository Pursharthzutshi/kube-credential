**Project Overview**
- Full-stack credential issuance and verification platform split into two Express services (`issuance-service`, `verification-service`) and a React/Vite frontend.
- Backends expose REST endpoints backed by MongoDB and share a configurable CORS layer so browser clients can talk to Render-hosted APIs.
- Frontend calls the APIs via an Axios client with configurable retry and timeout controls for cold-start resiliency.

**Architecture**
- Browser-based React frontend communicates with two Node/Express services exposed over HTTPS.
- Issuance and verification services share a MongoDB database to keep credential state consistent.
- CORS configuration is centralized so both services expose identical origin controls.
```
┌──────────────────────────────────────────┐
│ React UI (Vite, Axios, Tailwind)         │
└───────────────┬──────────────────────────┘
                │ HTTPS
                ▼
┌──────────────────────────────────────────┐
│ Issuance Service (Express, Render)       │
│  • POST /issue                           │
│  • GET /health                           │
└───────────────┬──────────────────────────┘
                │ shared MongoDB (Atlas/local)
┌───────────────▼──────────────────────────┐
│ Verification Service (Express, Render)   │
│  • POST /verify                          │
│  • GET /health                           │
└──────────────────────────────────────────┘
```

**Key Design Decisions**
- **Microservices split**: Separate issuance and verification services simplify scaling and deployment while sharing common MongoDB access code.
- **Configurable CORS**: Both services read `ALLOWED_ORIGINS` to support multi-environment deployments without code changes.
- **Idempotent issuance**: A unique index on credential IDs avoids duplicate issuance even under concurrent requests.
- **Frontend resiliency**: Axios wrapper adds retry/backoff and configurable timeout to mitigate cold starts on Render.
- **TypeScript everywhere**: Shared typing between services and frontend reduces runtime errors and eases refactoring.
- **Test isolation**: Jest mocks MongoDB interactions so unit tests run without external dependencies.

**Codebase Structure**
```
.
├── backend/
│   ├── issuance-service/
│   │   ├── src/
│   │   │   ├── app.ts            # Express app with shared CORS config
│   │   │   ├── db.ts             # MongoDB connection utilities
│   │   │   ├── routes.ts         # /issue endpoint
│   │   │   └── _tests_/          # Jest + Supertest suites
│   │   └── Dockerfile            # Multi-stage build for Render/App Runner
│   └── verification-service/
│       ├── src/
│       │   ├── app.ts            # Express app sharing CORS middleware
│       │   ├── db.ts             # Mongo connection helpers
│       │   ├── routes.ts         # /verify endpoint
│       │   └── _tests_/          # Jest + Supertest suites
│       └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api.ts                # Axios client with retry/timeout logic
│   │   ├── components/           # React UI components
│   │   └── setupTests.ts         # Testing Library setup
│   ├── public/                   # Static assets
│   └── vite.config.ts
└── .github/workflows/            # CI/CD pipelines (Render, ECR, etc.)
```

**Backend Services**
- Common stack: Express 4, TypeScript, MongoDB driver, `cors`, `body-parser`, Jest + Supertest for tests.
- `createApp()` in each service applies the shared CORS options. Allowed origins are read from `ALLOWED_ORIGINS` (comma-separated, no trailing slash) with sensible localhost fallbacks.
- Issuance workflow:
  - `POST /issue` expects `{ id, holder, metadata }`, ensures uniqueness, and records `issuedAt` + `workerId`.
  - `GET /health` reports status and current worker id (if `WORKER_ID` env is set).
- Verification workflow:
  - `POST /verify` expects `{ id }`, returns `{ verified, workerId, issuedAt }` or `404` when missing.
  - `GET /health` mirrors issuance health endpoint.

**Frontend**
- React 19 with Vite build pipeline, Tailwind via `@tailwindcss/vite`.
- API client (`frontend/src/api.ts`) reads base URLs from `VITE_ISSUANCE_URL` / `VITE_VERIFY_URL`, falling back to localhost ports 4001/4002 for local dev.
- Axios instance has configurable timeout and exponential retry (`VITE_API_TIMEOUT_MS`, `VITE_API_RETRY_ATTEMPTS`, `VITE_API_RETRY_DELAY_MS`).

**Environment Variables**
- Issuance service:
  - `PORT` (default `4001`)
  - `MONGO_URI` (default `mongodb://localhost:27017`)
  - `DB_NAME` (default `kube_credential`)
  - `ALLOWED_ORIGINS` (comma-separated list; optional)
  - `WORKER_ID` (optional identifier surfaced in responses)
- Verification service:
  - `PORT` (default `4002`)
  - `MONGO_URI`, `DB_NAME`, `ALLOWED_ORIGINS`, `WORKER_ID` (same semantics as issuance)
- Frontend (Vite expects `VITE_` prefix):
  - `VITE_ISSUANCE_URL` and `VITE_VERIFY_URL` (required for non-local deployments)
  - `VITE_API_TIMEOUT_MS` (optional, default 15000)
  - `VITE_API_RETRY_ATTEMPTS` (optional, default 3)
  - `VITE_API_RETRY_DELAY_MS` (optional, default 500)

**Local Development**
- Prerequisites: Node 20+, npm 10+, MongoDB (local or remote).
- Install dependencies:
  - `cd backend/issuance-service && npm ci`
  - `cd backend/verification-service && npm ci`
  - `cd frontend && npm ci`
- Run services:
  - Issuance: `npm run dev` (watches `src/index.ts`)
  - Verification: `npm run dev`
  - Frontend: `npm run dev` (Vite dev server, defaults to port 5173)
- Provide `.env` files or export env vars before starting services. Example `.env` for issuance:
  ```
  PORT=4001
  MONGO_URI=mongodb://localhost:27017
  DB_NAME=kube_credential
  ALLOWED_ORIGINS=http://localhost:5173
  ```

**Building and Running for Production**
- Each backend uses a multi-stage Dockerfile:
  - Build: `docker build -t issuance-service ./backend/issuance-service`
  - Run: `docker run -p 4001:4001 --env-file path/to/.env issuance-service`
- Frontend production build: `npm run build` inside `frontend`, then deploy `frontend/dist` to preferred hosting (e.g., Vercel).

**Testing**
- Issuance service: `npm run test` (Jest + Supertest). Tests mock MongoDB; no live database required.
- Verification service: `npm run test`.
- Frontend: `npm run test` runs Jest with Testing Library; `npm run lint` executes ESLint.
- Coverage commands available via `npm run test:coverage` in each project.

**Deployment Notes**
- Render (APIs): set `ALLOWED_ORIGINS` to include your Vercel domain(s) and configure `WORKER_ID` if you want deterministic IDs in logs.
- Vercel (frontend): set `VITE_ISSUANCE_URL`, `VITE_VERIFY_URL`, `VITE_API_TIMEOUT_MS`, `VITE_API_RETRY_ATTEMPTS`, `VITE_API_RETRY_DELAY_MS`.
- Ensure both backends point to the same MongoDB cluster so verification can locate issued credentials.

**My Contact Details**

Name: Pursharth Zutshi
Email Id: 13phzi@gmail.com
Phone No: +918360569922