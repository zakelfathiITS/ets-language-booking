# Roadmap — ETS Language Test Booking

Delivery plan for the ETS EMEA technical test. Work is split into large tickets
(`ETS-01` … `ETS-11`); each ticket is tracked as a GitHub issue, delivered through a
pull request and squash-merged, so `main` holds exactly one commit per ticket.

## Architecture decisions

| Area | Decision | Rationale |
|---|---|---|
| Backend framework | Symfony 6.4 LTS on PHP 8.3 | Long-term support until 11/2027, mature Doctrine MongoDB + LexikJWT ecosystem |
| Backend architecture | Hexagonal (ports & adapters): `Domain` / `Application` / `Infrastructure` / `UI` | Business rules are framework-agnostic and unit-testable; layer boundaries enforced by Deptrac |
| Bounded contexts | `Identity` (users, auth) · `Catalog` (test sessions) · `Booking` (reservations) | Aggregates reference each other by ID only |
| Persistence | Doctrine MongoDB ODM, **XML mapping** in `Infrastructure/Persistence/MongoDB/Mapping` | Domain classes carry no persistence metadata |
| Authentication | LexikJWTAuthenticationBundle (RS256), stateless firewalls | Standard JWT flow; role-based access (`ROLE_ADMIN` for catalog writes) |
| HTTP server | FrankenPHP (Caddy + PHP in one container) | Same single image for local Docker and container PaaS (Render) |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript strict | Current maintained line — Next 14/React 18 no longer receives security fixes |
| Frontend architecture | Atomic Design for UI (`atoms` → `molecules` → `organisms` → `templates` → pages) + feature modules for logic | Presentational components stay store-agnostic and testable; boundaries enforced by ESLint |
| State & data fetching | Redux Toolkit + RTK Query over an Axios base query | Cache invalidation keeps seats and reservations in sync after each booking |
| Database | MongoDB (Docker locally, Atlas M0 in the cloud) | Required by the specification |

## Tickets

### ETS-01 · Monorepo bootstrap & Docker environment
- [x] Monorepo layout: `backend/`, `frontend/`, `docs/`; `.editorconfig`, `.gitignore`, `.gitattributes`
- [x] Symfony 6.4 skeleton on a FrankenPHP / PHP 8.3 image (ext-mongodb, opcache, intl)
- [x] Next.js 16 + React 19 + TypeScript strict skeleton on a Node 24 image (standalone output)
- [x] `docker-compose.yml` (MongoDB → backend → frontend, gated by healthchecks) + `docker-compose.dev.yml` for hot reload
- [x] Documented `.env.example` files, no committed secrets, `Makefile` helpers
- [x] `GET /api/health` probing MongoDB
- [x] Bilingual README skeleton (FR/EN) and this roadmap

### ETS-02 · Backend hexagonal foundations & quality gates
- [x] Layered source tree and Deptrac ruleset
- [x] Doctrine ODM wired to the XML mapping directory; index creation on startup
- [x] Shared kernel: domain exception hierarchy, `Clock` port, pagination primitives
- [x] Uniform JSON error contract following RFC 9457 Problem Details (`422` with violations, `401`, `403`, `404`, `409`, `500`)
- [x] PHPStan (level 8), PHP-CS-Fixer (`@Symfony`), PHPUnit with an isolated test database
- [x] GitHub Actions backend pipeline

### ETS-03 · Identity: registration, JWT authentication & account API
- [x] `User` aggregate, `Email` value object, repository port + MongoDB adapter, unique email index
- [x] Use cases: `RegisterUser`, `GetProfile`, `UpdateProfile`
- [x] Security adapters (password hasher, security user, user provider), LexikJWT RS256, login throttling
- [x] `POST /api/auth/register`, `POST /api/auth/login`, `GET|PUT /api/me` with validated request DTOs
- [x] Unit and functional tests

### ETS-04 · Catalog: test sessions CRUD & pagination
- [x] `TestSession` aggregate (language, date, time, location, capacity, seats taken) and invariants
- [x] Use cases: create, update, delete, get, paginated list with filters
- [x] Admin-only write operations; idempotent `app:seed` demo data
- [x] Unit and functional tests

### ETS-05 · Booking: reservations, business rules & concurrency
- [x] `Reservation` aggregate (`session_id`, `user_id`, reservation date) with a unique `(session_id, user_id)` index
- [x] Atomic seat allocation port + MongoDB adapter (conditional `$inc`, compensation on failure)
- [x] Use cases: `BookSession`, `CancelReservation`, `ListUserReservations` (ownership enforced)
- [x] OpenAPI documentation at `/api/doc`
- [x] Unit, integration and functional tests (last seat, duplicates, cancellation, isolation between users)

### ETS-06 · Frontend foundations
- [x] Atomic Design component tree and feature modules, boundaries enforced by `eslint-plugin-boundaries`
- [x] Redux store, auth slice with persistence, RTK Query + Axios base query (Bearer token, 401 handling)
- [x] Route guards (authenticated / admin), responsive templates, base atoms and molecules
- [x] Jest + React Testing Library + MSW; GitHub Actions frontend pipeline

### ETS-07 · Frontend: authentication & account management
- [x] Login and registration forms with schema validation and API error mapping
- [x] Redirect to the reservations page after login; logout
- [x] Account page: view and update name and email
- [x] Tests

### ETS-08 · Frontend: session booking & reservation management
- [ ] Paginated session list (language, date, time, location, seats) with URL-synced page and filters
- [ ] Booking with explicit states (available, full, already booked, past) and conflict messages
- [ ] Reservation list with confirmed cancellation
- [ ] Loading, empty and error states; mobile-first layout; tests

### ETS-09 · Frontend: admin back-office
- [ ] `/admin/sessions` restricted to administrators
- [ ] Paginated table, create/edit form, guarded deletion
- [ ] Tests

### ETS-10 · Hardening, documentation & release candidate
- [ ] Security headers, CORS allowlist, rate limiting, dependency audits
- [ ] Index usage review, production build tuning
- [ ] Complete bilingual README: architecture, setup, tests, API, demo accounts, trade-offs
- [ ] Coverage reports, CI badges, clean-clone verification, `v1.0.0` tag

### ETS-11 · Deployment readiness
- [ ] Environment-driven production configuration (Atlas URI, JWT keys, CORS origin)
- [ ] Backend deployment descriptors (Render blueprint, Alwaysdata guide) — target to be confirmed
- [ ] Vercel configuration, Atlas setup, demo data seeding
- [ ] API wake-up screen for sleeping free-tier instances
- [ ] `docs/DEPLOYMENT.md`
