# ETS Language Test Booking

[English](#english) · [Français](#français)

---

## English

Web application for booking language test sessions: users sign in with a JWT,
browse the available sessions, book or cancel a seat, and manage their account.

> **Status:** under active development — see the [roadmap](docs/ROADMAP.md).

### Stack

| Layer | Technology |
|---|---|
| API | Symfony 6.4 LTS · PHP 8.3 · FrankenPHP · hexagonal architecture |
| Persistence | MongoDB 8 · Doctrine MongoDB ODM (XML mapping) |
| Web client | Next.js 16 · React 19 · TypeScript · Redux Toolkit · Tailwind CSS |
| Tooling | Docker Compose · PHPUnit · Jest · GitHub Actions |

### Quick start

Requirements: Docker with the Compose plugin.

```bash
git clone https://github.com/<owner>/ets-language-booking.git
cd ets-language-booking
docker compose up -d --build
```

| Service | URL |
|---|---|
| Web client | http://localhost:3000 |
| API | http://localhost:8000 |
| API documentation (Swagger UI) | http://localhost:8000/api/doc |
| Health check | http://localhost:8000/api/health |

Default settings work out of the box; copy `.env.example` to `.env` to change ports or credentials.

### Demo accounts

Loaded automatically on first start, together with 30 upcoming test sessions (the candidate already holds two reservations, and one session is full):

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@ets.test` | `Admin123!` |
| Candidate | `candidate@ets.test` | `Candidate123!` |

Set `APP_SEED_DEMO_DATA=0` in `.env` to start with an empty database.

### Development mode

```bash
make dev        # bind-mounted sources, hot reload, debug mode
make help       # all available commands
```

### Quality checks

```bash
make qa         # both apps: code style, static analysis, architecture rules, tests
make test       # test suites only (make test-backend / make test-frontend)
```

The same checks run in GitHub Actions on every pull request.

### Repository layout

```
backend/    Symfony REST API
frontend/   Next.js web client
docs/       Roadmap and technical documentation
```

---

## Français

Application web de réservation de sessions de tests de langues : l'utilisateur se
connecte via JWT, consulte les sessions disponibles, réserve ou annule une place et
gère son compte.

> **Statut :** en cours de développement — voir la [feuille de route](docs/ROADMAP.md).

### Stack technique

| Couche | Technologie |
|---|---|
| API | Symfony 6.4 LTS · PHP 8.3 · FrankenPHP · architecture hexagonale |
| Persistance | MongoDB 8 · Doctrine MongoDB ODM (mapping XML) |
| Client web | Next.js 16 · React 19 · TypeScript · Redux Toolkit · Tailwind CSS |
| Outillage | Docker Compose · PHPUnit · Jest · GitHub Actions |

### Démarrage rapide

Prérequis : Docker avec le plugin Compose.

```bash
git clone https://github.com/<owner>/ets-language-booking.git
cd ets-language-booking
docker compose up -d --build
```

| Service | URL |
|---|---|
| Client web | http://localhost:3000 |
| API | http://localhost:8000 |
| Documentation de l'API (Swagger UI) | http://localhost:8000/api/doc |
| Sonde de santé | http://localhost:8000/api/health |

La configuration par défaut fonctionne telle quelle ; copiez `.env.example` en `.env` pour modifier les ports ou les identifiants.

### Comptes de démonstration

Créés automatiquement au premier démarrage, avec 30 sessions de test à venir (le candidat a déjà deux réservations et une session est complète) :

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@ets.test` | `Admin123!` |
| Candidat | `candidate@ets.test` | `Candidate123!` |

Définissez `APP_SEED_DEMO_DATA=0` dans `.env` pour démarrer avec une base vide.

### Mode développement

```bash
make dev        # sources montées, rechargement à chaud, mode debug
make help       # liste des commandes disponibles
```

### Contrôles qualité

```bash
make qa         # les deux applications : style, analyse statique, règles d'architecture, tests
make test       # suites de tests uniquement (make test-backend / make test-frontend)
```

Les mêmes contrôles s'exécutent dans GitHub Actions à chaque pull request.

### Organisation du dépôt

```
backend/    API REST Symfony
frontend/   Client web Next.js
docs/       Feuille de route et documentation technique
```
