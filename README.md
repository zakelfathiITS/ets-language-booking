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
| Health check | http://localhost:8000/api/health |

Default settings work out of the box; copy `.env.example` to `.env` to change ports or credentials.

### Development mode

```bash
make dev        # bind-mounted sources, hot reload, debug mode
make help       # all available commands
```

### Quality checks

```bash
make qa         # coding standards, static analysis (PHPStan level 8), architecture rules (Deptrac), tests
make test       # test suites only
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
| Sonde de santé | http://localhost:8000/api/health |

La configuration par défaut fonctionne telle quelle ; copiez `.env.example` en `.env` pour modifier les ports ou les identifiants.

### Mode développement

```bash
make dev        # sources montées, rechargement à chaud, mode debug
make help       # liste des commandes disponibles
```

### Contrôles qualité

```bash
make qa         # style de code, analyse statique (PHPStan niveau 8), règles d'architecture (Deptrac), tests
make test       # suites de tests uniquement
```

Les mêmes contrôles s'exécutent dans GitHub Actions à chaque pull request.

### Organisation du dépôt

```
backend/    API REST Symfony
frontend/   Client web Next.js
docs/       Feuille de route et documentation technique
```
