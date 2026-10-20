# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contrat Manager is a web application for managing temporary mission contracts (French
staffing agency context). It is a React front end backed by a NestJS API and a PostgreSQL
database. PDF documents (contracts, certificates, invoices, payslips) are rendered server
side with Handlebars + Puppeteer. The app is multi-user with JWT authentication and
`admin` / `user` roles.

History: the project started as an Electron desktop app persisting to localStorage. The
migration to web + PostgreSQL was done without changing the data shapes the React modules
consume (see "Data layer").

## Common Commands

### Development
- `npm install && npm run api:install` - install front and API dependencies
- `npm run db:local` - start an embedded local PostgreSQL on port 5433 (no Docker needed)
- `npm run db:migrate` - apply Prisma migrations (`server/.env` must define `DATABASE_URL`)
- `npm run dev` - API (watch mode, :3001) + React dev server (:3000, proxies `/api`)
- `npm run start:api` / `npm run start:web` - run one side only

### Build, test, deploy
- `npm run build` - production build of the front
- `npm run api:build` - production build of the API (`server/dist`)
- `npm run api:smoke` - API smoke test (`server/scripts/smoke.js`, run on an empty DB)
- `npm run db:reset` - truncate all tables (development only)
- `docker compose --env-file .env.docker up -d --build` - full deployment (db + api + web)

### Inside `server/`
- `npm run start:dev`, `npm run build`, `npm run lint` (tsc --noEmit)
- `npx prisma migrate dev --name <name>` - create a new migration after editing `prisma/schema.prisma`

## Architecture

### Front (`src/`)
```
src/
├── services/
│   ├── ApiClient.js        fetch wrapper: base URL (/api), Bearer token, 401 handling
│   ├── AuthService.js      login / setup / users management
│   ├── DatabaseService.js  data facade keeping the historical method names, delegates to the API
│   └── PdfClient.js        POST /pdf/:type, opens the PDF in a new tab
├── contexts/AuthContext.js current user + logout for components
├── components/             Layout, Sidebar (user block + logout), LoginPage, BackupRestore
└── modules/                dashboard, employees, clients, contracts, timetracking,
                            invoices, payroll, settings (each with its Service + components)
```
- Routing uses `BrowserRouter` (nginx falls back to `index.html`).
- Module services (`ContractService`, `TimeTrackingService`, `SettingsService`, ...) keep
  their public method signatures; only their storage calls changed.
- `src/modules/employees/EmployeeForm copy.jsx` is dead legacy code (not imported).

### API (`server/`)
```
server/
├── prisma/schema.prisma    PostgreSQL schema; migrations in prisma/migrations
├── templates/*.hbs         PDF templates (extracted from the former Electron main.js)
├── scripts/                local-postgres.js, reset-db.js, smoke.js
└── src/
    ├── auth/, users/       JWT (passport-jwt), bcryptjs, global guard with @Public()/@Roles()
    ├── employees/ clients/ contracts/ time-entries/ invoices/ payslips/
    ├── settings/           company settings, reference lists (seeded defaults), signatures
    ├── counters/           atomic contract / invoice numbering
    ├── dashboard/ backup/ kv/ pdf/
    └── common/             guards, decorators, utils (coerce.ts, query.ts, documents.ts)
```

### Data layer
- Hybrid model: each entity table has typed columns (ids, FKs, status, key dates as ISO
  text, amounts) derived at write time, plus a `data` JSONB column holding the full
  document as sent by the front. Reads return `{...data, id, created_at/updated_at}`
  (numeric-id entities) or `{...data, id, createdAt, updatedAt}` (contracts, time entries).
- Contracts and time entries use uuid ids; employees, clients, invoices, payslips use
  serial ids. Reference lists use a composite key `(kind, id)` with per-kind ids.
- Contracts are enriched on read with `employee` / `client` objects; those objects (and
  `signature` / `stamp`) are stripped before storage.
- Time entries: `date` is `YYYY-MM-DD` text; unique on (employee, contract, date);
  `invoiced` entries cannot be modified or deleted (409).
- Contract numbers start at 100001, invoice numbers are `FAC-YYYY-NNNN` (global counter).
- Generic list endpoints accept equality filters as query params plus `order`/`direction`.

### Auth
- First run: `GET /auth/status` returns `needsSetup: true`; `POST /auth/setup` creates the
  first admin. Then `POST /auth/login` returns `{ token, user }`.
- Token stored in localStorage (`cm_auth_token`); `ApiClient` dispatches a logout on 401.
- Backup import and user management require the `admin` role.

### PDF
- `POST /api/pdf/:type` with `{ data, filename }` returns `application/pdf`.
- Browser detection: `PUPPETEER_EXECUTABLE_PATH`, else Edge/Chrome (Windows) or
  `/usr/bin/chromium` (Linux), else Puppeteer's bundled Chrome.

### Styling
- TailwindCSS, primary `#0073ff`, secondary `#0ea5e9`, Inter font.

## Development Notes
- Keep the response shapes of the API stable: the React modules rely on field names such
  as `firstName`, `companyName`, `startDate`, `employeeId` (string in time entries) and on
  the snake_case copies the invoice normalization adds (`invoice_number`, `total_amount`).
- Source files use CRLF line endings; prefer the Edit tool or CRLF-aware scripts.
- The smoke test documents the expected behaviour of every endpoint; extend it when adding
  features.
