DEV_COMPOSE  := devops/compose/docker-compose.dev.yml
PROD_COMPOSE := devops/compose/docker-compose.prod.yml
CERTS_DIR    := certs
CERT_FILES   := $(CERTS_DIR)/privkey.pem $(CERTS_DIR)/fullchain.pem $(CERTS_DIR)/dhparam.pem

all: up

certs: ## Generate TLS certificates if any are missing
	@missing=0; \
	for f in $(CERT_FILES); do \
		[ -f "$$f" ] || missing=1; \
	done; \
	if [ $$missing -eq 1 ]; then \
		echo "[*] Missing certificates — running init-certs.sh..."; \
		./scripts/init-certs.sh; \
	fi

# --- Development Environment ---
up: ## Start all dev containers (detached)
	docker compose --env-file .env -f $(DEV_COMPOSE) up -d

build: ## Build and start all dev containers
	docker compose --env-file .env -f $(DEV_COMPOSE) up --build -d

down: ## Stop all dev containers
	docker compose --env-file .env -f $(DEV_COMPOSE) down

logs: ## Follow logs for all dev containers
	docker compose --env-file .env -f $(DEV_COMPOSE) logs -f

ps: ## Show running dev containers
	docker compose --env-file .env -f $(DEV_COMPOSE) ps

clean: ## Stop and remove all dev containers + volumes
	docker compose --env-file .env -f $(DEV_COMPOSE) down -v

re: down build ## Rebuild dev from scratch

# --- Production Environment ---
up-prod: certs ## Start all prod containers (detached)
	docker compose --env-file .env -f $(PROD_COMPOSE) up -d

build-prod: certs ## Build and start all prod containers
	docker compose --env-file .env -f $(PROD_COMPOSE) up --build -d

down-prod: ## Stop all prod containers
	docker compose --env-file .env -f $(PROD_COMPOSE) down

logs-prod: ## Follow logs for all prod containers
	docker compose --env-file .env -f $(PROD_COMPOSE) logs -f

ps-prod: ## Show running prod containers
	docker compose --env-file .env -f $(PROD_COMPOSE) ps

clean-prod: ## Stop and remove all prod containers + volumes
	docker compose --env-file .env -f $(PROD_COMPOSE) down -v

re-prod: down-prod build-prod ## Rebuild prod from scratch

# --- Global ---
fclean: clean clean-prod ## Nuclear option — prune everything (Docker system prune) and remove certs
	docker system prune -af --volumes
	rm -rf $(CERTS_DIR)

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

.PHONY: all up build down logs ps clean re up-prod build-prod down-prod logs-prod ps-prod clean-prod re-prod fclean certs help
