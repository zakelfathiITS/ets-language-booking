# Roadmap — ETS Language Test Booking

Delivery plan for the ETS EMEA technical test. Work is split into large tickets;
each ticket is tracked as a GitHub issue, delivered through a pull request and
squash-merged, so `main` holds exactly one commit per ticket.

Delivery order: ETS-01 → ETS-09, then ETS-12 (cleanup), ETS-13 (i18n) and ETS-14
(UI refresh), added along the way, then ETS-10 (security), ETS-15 (release candidate,
split from ETS-10) and ETS-11 (deployment).

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
- [x] Paginated session list (language, date, time, location, seats) with URL-synced page and filters
- [x] Booking with explicit states (available, full, already booked, past) and conflict messages
- [x] Reservation list with confirmed cancellation
- [x] Loading, empty and error states; mobile-first layout; tests

### ETS-09 · Frontend: admin back-office
- [x] `/admin/sessions` restricted to administrators
- [x] Paginated table, create/edit form, guarded deletion
- [x] Tests

### ETS-12 · Codebase cleanup & reorganisation
- [x] Unused files, exports and dependencies detected with tools (knip, shipmonk dead-code detector) and removed
- [x] Scaffolding leftovers removed (unused routes, redundant wrappers, boilerplate configuration)
- [x] Harmonised layout: `tests/` on both sides, `@tests/*` import alias for test utilities
- [x] Unused-code checks added to the quality gates and CI
- [x] Project structure documented in the README

### ETS-13 · Internationalisation (English & French)
- [x] Translation infrastructure, language switcher, remembered choice (browser language by default)
- [x] Every screen, message, validation and date format translated
- [x] API errors translated from their stable code; backend validation messages localised from `Accept-Language`
- [x] Tests for both languages and the fallback

### ETS-14 · Modern UI refresh
- [x] Design tokens (palette, typography, radii, shadows) and a clear brand identity
- [x] Refreshed shell, authentication screens, cards, tables and empty states
- [x] Micro-interactions respecting `prefers-reduced-motion`; dark mode
- [x] Brand icon and metadata; WCAG AA contrast in both themes

### ETS-10 · Security review & hardening
- [x] Token in an httpOnly `SameSite=Strict` cookie behind a same-origin `/api` relay (no CORS); revocation on sign-out
- [x] Rate limiting: failed logins per client, per account and per both; registration, booking, profile updates
- [x] Trusted visitor address from the relay (shared secret), security headers on both apps, nonce-based CSP
- [x] Password policy (12+ characters, breached passwords refused), same answer and timing for unknown accounts
- [x] Dependency audits and secret scanning in CI (and weekly); `docs/SECURITY.md`

### ETS-15 · Release candidate
- [x] Index usage review (listings read in index order, no in-memory sort), production build review
- [x] Capacity changes and deletions made atomic: no overbooking under concurrent administrator edits
- [x] Complete bilingual README: features, architecture, API, business rules, tests, configuration, trade-offs
- [x] Coverage counted for functional tests, coverage reports and badges in CI; Swagger UI served without third-party scripts
- [x] Clean-clone verification, `v1.0.0` tag

### ETS-11 · Deployment readiness
- [ ] Environment-driven production configuration (Atlas URI, JWT keys, proxy secret)
- [ ] Backend deployment descriptors (Render blueprint, Alwaysdata guide) — target to be confirmed
- [ ] Vercel configuration, Atlas setup, demo data seeding
- [ ] API wake-up screen for sleeping free-tier instances
- [ ] `docs/DEPLOYMENT.md`
