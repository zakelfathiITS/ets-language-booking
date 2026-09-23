# ETS Language Test Booking

[![Backend](https://github.com/zakelfathiITS/ets-language-booking/actions/workflows/backend.yml/badge.svg)](https://github.com/zakelfathiITS/ets-language-booking/actions/workflows/backend.yml)
[![Frontend](https://github.com/zakelfathiITS/ets-language-booking/actions/workflows/frontend.yml/badge.svg)](https://github.com/zakelfathiITS/ets-language-booking/actions/workflows/frontend.yml)
[![Security](https://github.com/zakelfathiITS/ets-language-booking/actions/workflows/security.yml/badge.svg)](https://github.com/zakelfathiITS/ets-language-booking/actions/workflows/security.yml)

| | |
|---|---|
| **Live demo · Démo en ligne** | https://ets-language-booking.vercel.app |
| **API documentation · Documentation de l'API** | https://ets-booking-api.onrender.com/api/doc |
| **Demo accounts · Comptes de démonstration** | `candidate@ets.test` / `Candidate123!` · `admin@ets.test` / `Admin123!` |

The API is hosted for free and sleeps when unused: the first page can take up to a minute to load.

L'API, hébergée gratuitement, se met en veille : le premier chargement peut prendre jusqu'à une minute.

[English](#english) · [Français](#français)

---

## English

A web application for booking language test sessions. Candidates sign in, browse the upcoming
sessions, book or cancel a seat and manage their account; administrators manage the catalogue.

### Features

- **Candidates:** sign up and sign in; browse upcoming sessions (paginated, filtered by language
  or by seats left); book a seat; list and cancel their reservations; edit their name and email.
- **Administrators:** create, edit and delete sessions, with the booked seats in view.
- **Everyone:** English or French, light or dark theme, keyboard and screen-reader friendly.

### Quick start

Requirements: Docker with the Compose plugin.

```bash
git clone https://github.com/zakelfathiITS/ets-language-booking.git
cd ets-language-booking
docker compose up -d --build
```

| Service | URL |
|---|---|
| Web client | http://localhost:3000 |
| API documentation (Swagger UI) | http://localhost:8000/api/doc |
| API health check | http://localhost:8000/api/health |

The browser only talks to the web client, which relays `/api/*` to the API; port 8000 serves the
API directly for its documentation and for API clients. Defaults work out of the box: copy
`.env.example` to `.env` to change ports or credentials.

### Demo accounts

Loaded on first start, with 30 upcoming sessions (the candidate already holds two reservations,
and one session is full). The sign-in page offers them in one click.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@ets.test` | `Admin123!` |
| Candidate | `candidate@ets.test` | `Candidate123!` |

Set `APP_SEED_DEMO_DATA=0` to start with an empty database.

### Architecture

```
Browser ──▶ Next.js web client ──/api/* relay──▶ Symfony API ──▶ MongoDB
            pages (React)                        hexagonal core
```

**API — hexagonal architecture** (ports and adapters), in three bounded contexts: `Identity`
(accounts), `Catalog` (test sessions) and `Booking` (reservations), which refer to one another
by id only.

| Layer | Contents | Depends on |
|---|---|---|
| `Domain` | Aggregates, value objects, business rules and ports (interfaces), framework-free | nothing |
| `Application` | One use case per command or query, with its handler | Domain |
| `Infrastructure` | Adapters: MongoDB (Doctrine ODM with **XML mapping**), security, clock | Domain, Application |
| `UI` | HTTP controllers, request DTOs, presenters, CLI commands | Application |

- Business rules live in the aggregates; handlers orchestrate; adapters guarantee what only the
  database can guarantee under concurrency (see [Business rules](#business-rules)).
- Errors follow RFC 9457 (`application/problem+json`) with a stable `code` per case.
- Deptrac enforces the layer rules; PHPStan (level 8) and a dead-code detector run on every change.

**Web client — Atomic Design** for the interface (`atoms` → `molecules` → `organisms` →
`templates` → pages) and **feature modules** for the logic (`auth`, `sessions`, `reservations`,
`admin`…). Components receive data and callbacks only; features own the state (Redux Toolkit) and
the API calls (RTK Query over Axios, with cache invalidation keeping seats and reservations in
sync). ESLint boundaries enforce these dependencies.

```
backend/                     Symfony REST API
├── src/
│   ├── Domain/              business rules: Identity, Catalog, Booking, Shared
│   ├── Application/         use cases (command/query + handler)
│   ├── Infrastructure/      MongoDB (XML mapping, repositories), security, clock
│   └── UI/                  HTTP controllers, request DTOs, presenters, CLI
├── tests/                   Unit/, Integration/, Functional/ (+ Support/)
└── config/, docker/         Symfony and FrankenPHP configuration

frontend/                    Next.js web client
├── src/
│   ├── app/                 routes; app/api relays the API calls
│   ├── components/          atoms/, molecules/, organisms/, templates/
│   ├── features/            state and API calls per domain
│   ├── services/http/       Axios client and RTK Query base API
│   ├── store/               Redux store
│   └── lib/, types/         helpers, API relay, validation, i18n, API types
└── tests/                   setup, MSW mocks, fixtures, architecture tests

docs/                        roadmap (with architecture decisions) and security
```

### API

Interactive documentation: http://localhost:8000/api/doc (sign in there with a demo account).

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Create an account |
| `POST` | `/api/auth/login` | public | Sign in: sets the token cookie |
| `POST` | `/api/auth/logout` | public | Sign out: revokes the token |
| `GET` `PUT` | `/api/me` | signed in | Read or update one's name and email |
| `GET` | `/api/sessions` | signed in | Sessions, paginated: `page`, `limit` (≤ 50), `language`, `availableOnly`, `includePast` |
| `GET` | `/api/sessions/languages` | signed in | Languages of the upcoming sessions |
| `GET` | `/api/sessions/{id}` | signed in | One session |
| `POST` `PUT` `DELETE` | `/api/sessions[/{id}]` | administrators | Manage the catalogue |
| `GET` `POST` | `/api/reservations` | signed in | List one's reservations, book a seat |
| `GET` `DELETE` | `/api/reservations/{id}` | owner | Read or cancel one's reservation |
| `GET` | `/api/health` | public | API and database status |

Request bodies are JSON. Errors are Problem Details with a `code`, e.g. `session_full`,
`already_reserved`, `session_already_started`, `capacity_below_reserved_seats`,
`session_has_reservations`, `email_already_in_use`, or `validation_failed` with field-level
`violations`. Validation messages follow the `Accept-Language` header.

### Business rules

- A session has a language, a date and time (in `APP_TIMEZONE`), a location and 1 to 1,000 seats;
  it must be scheduled in the future.
- A seat can be booked while the session has not started and has seats left; a user holds at
  most one reservation per session, and can cancel it until the session starts.
- **No overbooking, even under concurrency:** a seat is taken with a single conditional update in
  MongoDB, and a unique index forbids a second reservation for the same user and session. An
  administrator cannot lower the capacity below the seats booked, nor delete a session with
  bookings, even when a booking arrives at the same moment.
- Emails are unique (case-insensitive); names have 2 to 100 characters; passwords at least 12,
  and must not appear in known data breaches.

### Tests and quality

```bash
make qa         # both apps: code style, static analysis, architecture rules, tests
make test       # test suites only (make test-backend / make test-frontend)
```

| | Tests | Line coverage | Also checked |
|---|---|---|---|
| API | 215 PHPUnit tests: unit (domain, use cases), integration (MongoDB adapters, real concurrency), functional (HTTP) | 97.4 % | PHP-CS-Fixer, PHPStan level 8, dead code, Deptrac |
| Web client | 145 Jest tests (Testing Library, MSW): components, screens, store, API relay | 90.7 % | ESLint and architecture boundaries, TypeScript, knip, production build |

GitHub Actions runs everything on each pull request, publishes the coverage in the run summary
(with the HTML report as an artifact), and a Security workflow scans for secrets and audits the
dependencies on every change and weekly.

### Configuration

| Variable | Default (local) | Purpose |
|---|---|---|
| `BACKEND_PORT`, `FRONTEND_PORT` | `8000`, `3000` | Published ports |
| `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `MONGODB_DB` | local values | Database |
| `APP_SECRET`, `JWT_PASSPHRASE` | local-only values | Secrets of the API: set real ones outside a laptop |
| `APP_TIMEZONE` | `Europe/Paris` | Timezone of session dates and times |
| `APP_SEED_DEMO_DATA` | `1` | Demo accounts and sessions on first start |
| `AUTH_COOKIE_SECURE` | `0` | `1` when served over HTTPS |
| `API_PROXY_SECRET` | local-only value | Shared by the relay and the API |
| `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | `true` | One-click demo accounts on the sign-in page |

### Languages

English and French. The application follows the browser language by default; the switcher in the
header remembers an explicit choice. API validation messages follow `Accept-Language`, and the
client translates business errors from their `code`.

### Interface

Light and dark themes follow the operating system, animations stop when the system asks for
reduced motion, and colours meet WCAG AA contrast in both themes.

### Security

- **Session:** the JWT lives in an `httpOnly`, `SameSite=Strict` cookie that scripts cannot read.
  The browser only talks to the web client's origin, which relays `/api/*` to the API: the
  cookie stays first-party and the API needs no CORS. Signing out revokes the token.
- **Abuse:** failed logins are limited per client, per account and per both; registration,
  booking and profile updates are rate-limited too. Unknown emails and wrong passwords get
  the same answer, in the same time.
- **Browser hardening:** a nonce-based Content Security Policy and the usual security headers
  on both applications.
- **Supply chain:** dependency audits and secret scanning on every change and weekly.

Details, trade-offs and known limitations: [docs/SECURITY.md](docs/SECURITY.md).

### Trade-offs and limitations

- **Offset pagination** (`page`, `limit`): simple and bookmarkable; the indexes serve each page
  in order without sorting in memory. A very large catalogue would call for cursor pagination.
- **One timezone** for all sessions (`APP_TIMEZONE`), shown on screen. Sessions in several
  timezones would store theirs with each session.
- **Rate limits are kept per API instance;** several instances would share them through Redis.
- **Out of scope:** email verification, password reset and account deletion.
- **Performance headroom:** FrankenPHP's worker mode (kernel kept in memory between requests)
  is not enabled; it would cut response times further once the services are reviewed for
  state kept between requests.
- **Demo data** and one-click demo accounts suit a review; turn both off for real use.

### Deployment

The live demo (https://ets-language-booking.vercel.app) runs for free on Vercel (web client),
Render (API) and MongoDB Atlas (database), all in Frankfurt. Step by step, in about 30 minutes:
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Development

```bash
make dev        # bind-mounted sources, hot reload, debug mode
make help       # all available commands
```

The [roadmap](docs/ROADMAP.md) lists the tickets and the architecture decisions behind them.

---

## Français

Application web de réservation de sessions de tests de langues. Les candidats se connectent,
consultent les sessions à venir, réservent ou annulent une place et gèrent leur compte ; les
administrateurs gèrent le catalogue.

### Fonctionnalités

- **Candidats :** inscription et connexion ; sessions à venir (paginées, filtrées par langue ou
  par places restantes) ; réservation d'une place ; liste et annulation de leurs réservations ;
  modification de leur nom et de leur e-mail.
- **Administrateurs :** création, modification et suppression des sessions, places réservées
  en vue.
- **Pour tous :** anglais ou français, thème clair ou sombre, utilisable au clavier et avec un
  lecteur d'écran.

### Démarrage rapide

Prérequis : Docker avec le plugin Compose.

```bash
git clone https://github.com/zakelfathiITS/ets-language-booking.git
cd ets-language-booking
docker compose up -d --build
```

| Service | URL |
|---|---|
| Client web | http://localhost:3000 |
| Documentation de l'API (Swagger UI) | http://localhost:8000/api/doc |
| Sonde de santé de l'API | http://localhost:8000/api/health |

Le navigateur ne s'adresse qu'au client web, qui relaie `/api/*` vers l'API ; le port 8000 sert
l'API directement, pour sa documentation et les clients d'API. La configuration par défaut
fonctionne telle quelle : copiez `.env.example` en `.env` pour modifier les ports ou les
identifiants.

### Comptes de démonstration

Créés au premier démarrage, avec 30 sessions à venir (le candidat a déjà deux réservations et une
session est complète). La page de connexion les propose en un clic.

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin@ets.test` | `Admin123!` |
| Candidat | `candidate@ets.test` | `Candidate123!` |

Définissez `APP_SEED_DEMO_DATA=0` pour démarrer avec une base vide.

### Architecture

```
Navigateur ──▶ client web Next.js ──relais /api/*──▶ API Symfony ──▶ MongoDB
               pages (React)                         cœur hexagonal
```

**API — architecture hexagonale** (ports et adaptateurs), en trois contextes métier :
`Identity` (comptes), `Catalog` (sessions de test) et `Booking` (réservations), qui ne se
référencent que par identifiant.

| Couche | Contenu | Dépend de |
|---|---|---|
| `Domain` | Agrégats, objets valeur, règles métier et ports (interfaces), sans framework | rien |
| `Application` | Un cas d'usage par commande ou requête, avec son handler | Domain |
| `Infrastructure` | Adaptateurs : MongoDB (Doctrine ODM avec **mapping XML**), sécurité, horloge | Domain, Application |
| `UI` | Contrôleurs HTTP, DTO de requête, présentateurs, commandes CLI | Application |

- Les règles métier vivent dans les agrégats ; les handlers orchestrent ; les adaptateurs
  garantissent ce que seule la base peut garantir en concurrence (voir
  [Règles métier](#règles-métier)).
- Les erreurs suivent la RFC 9457 (`application/problem+json`) avec un `code` stable par cas.
- Deptrac vérifie les règles de couches ; PHPStan (niveau 8) et un détecteur de code mort
  s'exécutent à chaque modification.

**Client web — Atomic Design** pour l'interface (`atoms` → `molecules` → `organisms` →
`templates` → pages) et **modules fonctionnels** pour la logique (`auth`, `sessions`,
`reservations`, `admin`…). Les composants ne reçoivent que des données et des callbacks ; les
modules portent l'état (Redux Toolkit) et les appels d'API (RTK Query sur Axios, dont
l'invalidation du cache garde places et réservations synchronisées). ESLint vérifie ces
dépendances.

```
backend/                     API REST Symfony
├── src/
│   ├── Domain/              règles métier : Identity, Catalog, Booking, Shared
│   ├── Application/         cas d'usage (commande/requête + handler)
│   ├── Infrastructure/      MongoDB (mapping XML, repositories), sécurité, horloge
│   └── UI/                  contrôleurs HTTP, DTO de requête, présentateurs, CLI
├── tests/                   Unit/, Integration/, Functional/ (+ Support/)
└── config/, docker/         configuration Symfony et FrankenPHP

frontend/                    client web Next.js
├── src/
│   ├── app/                 routes ; app/api relaie les appels d'API
│   ├── components/          atoms/, molecules/, organisms/, templates/
│   ├── features/            état et appels d'API par domaine
│   ├── services/http/       client Axios et API RTK Query
│   ├── store/               store Redux
│   └── lib/, types/         utilitaires, relais d'API, validation, i18n, types de l'API
└── tests/                   configuration, mocks MSW, jeux de données, tests d'architecture

docs/                        feuille de route (avec les décisions d'architecture) et sécurité
```

### API

Documentation interactive : http://localhost:8000/api/doc (connectez-vous-y avec un compte de
démonstration).

| Méthode | Chemin | Accès | Rôle |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Créer un compte |
| `POST` | `/api/auth/login` | public | Se connecter : pose le cookie du jeton |
| `POST` | `/api/auth/logout` | public | Se déconnecter : révoque le jeton |
| `GET` `PUT` | `/api/me` | connecté | Lire ou modifier son nom et son e-mail |
| `GET` | `/api/sessions` | connecté | Sessions paginées : `page`, `limit` (≤ 50), `language`, `availableOnly`, `includePast` |
| `GET` | `/api/sessions/languages` | connecté | Langues des sessions à venir |
| `GET` | `/api/sessions/{id}` | connecté | Une session |
| `POST` `PUT` `DELETE` | `/api/sessions[/{id}]` | administrateurs | Gérer le catalogue |
| `GET` `POST` | `/api/reservations` | connecté | Lister ses réservations, réserver une place |
| `GET` `DELETE` | `/api/reservations/{id}` | propriétaire | Lire ou annuler sa réservation |
| `GET` | `/api/health` | public | État de l'API et de la base |

Les corps de requête sont en JSON. Les erreurs sont des Problem Details avec un `code`, par
exemple `session_full`, `already_reserved`, `session_already_started`,
`capacity_below_reserved_seats`, `session_has_reservations`, `email_already_in_use`, ou
`validation_failed` avec les `violations` par champ. Les messages de validation suivent l'en-tête
`Accept-Language`.

### Règles métier

- Une session a une langue, une date et une heure (dans `APP_TIMEZONE`), un lieu et de 1 à
  1 000 places ; elle doit être planifiée dans le futur.
- Une place se réserve tant que la session n'a pas commencé et qu'il reste des places ; un
  utilisateur détient au plus une réservation par session et peut l'annuler jusqu'au début de
  la session.
- **Pas de surréservation, même en concurrence :** une place est prise par une seule mise à jour
  conditionnelle dans MongoDB, et un index unique interdit une seconde réservation pour le même
  utilisateur et la même session. Un administrateur ne peut ni descendre la capacité sous les
  places réservées, ni supprimer une session qui a des réservations, même si une réservation
  arrive au même instant.
- Les e-mails sont uniques (sans tenir compte de la casse) ; les noms ont de 2 à 100 caractères ;
  les mots de passe au moins 12, et ne doivent pas figurer dans des fuites de données connues.

### Tests et qualité

```bash
make qa         # les deux applications : style, analyse statique, règles d'architecture, tests
make test       # suites de tests uniquement (make test-backend / make test-frontend)
```

| | Tests | Couverture des lignes | Autres contrôles |
|---|---|---|---|
| API | 215 tests PHPUnit : unitaires (domaine, cas d'usage), d'intégration (adaptateurs MongoDB, vraie concurrence), fonctionnels (HTTP) | 97,4 % | PHP-CS-Fixer, PHPStan niveau 8, code mort, Deptrac |
| Client web | 145 tests Jest (Testing Library, MSW) : composants, écrans, store, relais d'API | 90,7 % | ESLint et frontières d'architecture, TypeScript, knip, build de production |

GitHub Actions exécute l'ensemble à chaque pull request, publie la couverture dans le résumé de
l'exécution (avec le rapport HTML en artefact), et un workflow Security recherche les secrets et
audite les dépendances à chaque modification et chaque semaine.

### Configuration

| Variable | Défaut (local) | Rôle |
|---|---|---|
| `BACKEND_PORT`, `FRONTEND_PORT` | `8000`, `3000` | Ports publiés |
| `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `MONGODB_DB` | valeurs locales | Base de données |
| `APP_SECRET`, `JWT_PASSPHRASE` | valeurs locales uniquement | Secrets de l'API : à remplacer hors d'un poste de développement |
| `APP_TIMEZONE` | `Europe/Paris` | Fuseau horaire des dates et heures des sessions |
| `APP_SEED_DEMO_DATA` | `1` | Comptes et sessions de démonstration au premier démarrage |
| `AUTH_COOKIE_SECURE` | `0` | `1` lorsque le site est servi en HTTPS |
| `API_PROXY_SECRET` | valeur locale uniquement | Partagé par le relais et l'API |
| `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | `true` | Comptes de démonstration en un clic sur la page de connexion |

### Langues

Anglais et français. L'application suit la langue du navigateur par défaut ; le sélecteur de
l'en-tête mémorise un choix explicite. Les messages de validation de l'API suivent
`Accept-Language`, et le client traduit les erreurs métier à partir de leur `code`.

### Interface

Les thèmes clair et sombre suivent le réglage du système, les animations s'arrêtent lorsque le
système demande de les réduire, et les couleurs respectent le contraste WCAG AA dans les deux
thèmes.

### Sécurité

- **Session :** le JWT est conservé dans un cookie `httpOnly`, `SameSite=Strict`, illisible par
  les scripts. Le navigateur ne s'adresse qu'à l'origine du client web, qui relaie `/api/*` vers
  l'API : le cookie reste interne au site et l'API n'a pas besoin de CORS. La déconnexion
  révoque le jeton.
- **Abus :** les échecs de connexion sont limités par client, par compte et par les deux ;
  l'inscription, la réservation et la modification du profil sont aussi limitées. Un e-mail
  inconnu et un mauvais mot de passe reçoivent la même réponse, dans le même délai.
- **Navigateur :** une Content Security Policy à nonce et les en-têtes de sécurité usuels sur
  les deux applications.
- **Dépendances et secrets :** audits de dépendances et détection de secrets à chaque
  modification et chaque semaine.

Détails, compromis et limites connues (en anglais) : [docs/SECURITY.md](docs/SECURITY.md).

### Compromis et limites

- **Pagination par décalage** (`page`, `limit`) : simple et adressable ; les index servent chaque
  page dans l'ordre, sans tri en mémoire. Un très grand catalogue appellerait une pagination
  par curseur.
- **Un seul fuseau horaire** pour toutes les sessions (`APP_TIMEZONE`), affiché à l'écran. Des
  sessions dans plusieurs fuseaux stockeraient le leur avec chaque session.
- **Les limites de débit sont conservées par instance de l'API ;** plusieurs instances les
  partageraient via Redis.
- **Hors périmètre :** vérification de l'e-mail, réinitialisation et suppression de compte.
- **Marge de performance :** le mode worker de FrankenPHP (noyau conservé en mémoire entre les
  requêtes) n'est pas activé ; il réduirait encore les temps de réponse, après revue des
  services qui conservent un état entre les requêtes.
- **Les données de démonstration** et les comptes en un clic conviennent à une revue ;
  désactivez-les pour un usage réel.

### Déploiement

La démo en ligne (https://ets-language-booking.vercel.app) tourne gratuitement sur Vercel
(client web), Render (API) et MongoDB Atlas (base de données), tous à Francfort. Pas à pas, en
30 minutes environ (en anglais) : [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Développement

```bash
make dev        # sources montées, rechargement à chaud, mode debug
make help       # liste des commandes disponibles
```

La [feuille de route](docs/ROADMAP.md) liste les tickets et les décisions d'architecture qui les
sous-tendent.
