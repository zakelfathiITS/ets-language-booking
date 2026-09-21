COMPOSE      = docker compose
COMPOSE_DEV  = docker compose -f docker-compose.yml -f docker-compose.dev.yml
BACKEND      = $(COMPOSE_DEV) exec backend
FRONTEND     = $(COMPOSE_DEV) exec frontend

.DEFAULT_GOAL := help
.PHONY: help up down dev dev-down logs ps sh-backend sh-frontend console clean

help: ## List available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the production-like stack
	$(COMPOSE) up -d --build

down: ## Stop the production-like stack
	$(COMPOSE) down

dev: ## Start the development stack (hot reload)
	$(COMPOSE_DEV) up -d --build

dev-down: ## Stop the development stack
	$(COMPOSE_DEV) down

logs: ## Follow logs of all services
	$(COMPOSE) logs -f

ps: ## Show service status
	$(COMPOSE) ps

sh-backend: ## Open a shell in the backend container (dev stack)
	$(BACKEND) bash

sh-frontend: ## Open a shell in the frontend container (dev stack)
	$(FRONTEND) sh

console: ## Run a Symfony console command, e.g. make console c="debug:router"
	$(BACKEND) bin/console $(c)

clean: ## Stop everything and delete volumes (database included)
	$(COMPOSE_DEV) down -v --remove-orphans
