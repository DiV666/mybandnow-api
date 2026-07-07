# shellcheck disable=SC1072,SC1073,SC1089,SC2046,SC2276,SC2283
DC:=docker compose
PROTECTED_BRANCHES:=main master
CURRENT_BRANCH:=$(shell git rev-parse --abbrev-ref HEAD)
CURRENT_BRANCH_IS_PROTECTED:=$(filter $(CURRENT_BRANCH),$(PROTECTED_BRANCHES))
TARGET_BRANCH=$(shell if git show-ref --verify --quiet refs/heads/main || git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then printf 'main'; else printf 'master'; fi)
PROTECTED_BRANCH_ERROR:=ERROR: Estás en la rama 'main' o 'master'. Colócate en tu rama de desarrollo/feature. Ar favó.

# Inside container: execute command directly. Outside: execute via docker compose.
EXEC_CMD:=$(shell [ -f /.dockerenv ] || printf '%s' '$(DC) run --rm mybandnow-api')
EXEC_NO_DEPS_CMD:=$(shell [ -f /.dockerenv ] || printf '%s' '$(DC) run --rm --no-deps mybandnow-api')

init:
	make build-containers
	make exec-no-deps c="npm install"

# Build all containers.
build-containers:
	@$(DC) build
	@$(DC) pull

# Build the services and the application.
build-project:
	make exec-no-deps c="npm run build"

# Run the API unit and integration tests in a single Vitest invocation with coverage (90% gate).
# Acceptance tests are NOT part of this coverage number (see docs/testing.md) — run
# `make acceptance-tests` separately.
build-tests:
	make exec c="npm run build:tests"

# Run the API generate-docs task.
build-docs:
	make exec c="npm run build:docs"

# Run the services and the application in development mode.
watch:
	@if [ -n "$(EXEC_CMD)" ]; then \
		$(DC) up --attach mybandnow-api; \
	else \
		npm run development:watch; \
	fi

# Run the services and the application in production mode.
start:
	@if [ -n "$(EXEC_CMD)" ]; then \
		$(DC) run --rm -p 4008:4008 mybandnow-api sh -lc "npm run build && npm start"; \
	else \
		npm run build && npm start; \
	fi

# Run the API unit, acceptance and integration tests.
tests:
	make exec c="npm run tests"

# Run the API unit tests.
unit-tests:
	make exec-no-deps c="npm run tests:unit"

# Run the API integration tests.
integration-tests:
	make exec c="npm run tests:integration"

# Run the API acceptance tests.
acceptance-tests:
	make exec c="npm run tests:acceptance"

# Open a shell inside the API container.
shell:
	make exec c="/bin/bash"

# Run command inside container
exec: check-c-param
	@$(EXEC_CMD) $(c)

# Run command inside container without starting dependencies
exec-no-deps: check-c-param
	@$(EXEC_NO_DEPS_CMD) $(c)

# Clean containers
clean-all:
	rm -rf node_modules package-lock.json
	@$(DC) down --rmi local --volumes --remove-orphans

# Merge changes into main/master
merge:
	@echo "Iniciando el despliegue..."
	@echo "Rama actual de desarrollo: $(CURRENT_BRANCH)"
	@if [ -n "$(CURRENT_BRANCH_IS_PROTECTED)" ]; then \
		echo "$(PROTECTED_BRANCH_ERROR)" >&2; \
		exit 1; \
	fi; \
	echo "Mergeando cambios en la rama $(TARGET_BRANCH)."; \
	git checkout $(TARGET_BRANCH); \
	git pull origin $(TARGET_BRANCH); \
	git merge --no-ff --no-edit $(CURRENT_BRANCH); \
	echo "Ejecuta 'make upgrade-version v=<patch|minor|major>' para publicar una versión."

# Run security audit (informational, for local dev)
audit:
	@echo "Running security audit against npm public registry..."
	@$(EXEC_NO_DEPS_CMD) npm audit --registry=https://registry.npmjs.org/ || echo "⚠️  Vulnerabilities found. Review output above."

# Run security audit (strict, for CI/CD)
audit-ci:
	@$(EXEC_NO_DEPS_CMD) ./build-tools/audit-ci.sh

# Update version
upgrade-version:
	@if [ -z "$(EXEC_CMD)" ]; then \
		echo "ERROR: Run 'make upgrade-version' from the host so git operations execute outside the container." >&2; \
		exit 1; \
	fi
	@if [ -z "$(CURRENT_BRANCH_IS_PROTECTED)" ]; then \
		echo "ERROR: 'make upgrade-version' only runs from 'main' or 'master'. Current branch: $(CURRENT_BRANCH)." >&2; \
		exit 1; \
	fi
	@$(MAKE) exec-no-deps c="./build-tools/make-upgrade-version.sh prepare $(v)"
	@./build-tools/make-upgrade-version.sh finalize

check-c-param:
ifeq ($(strip $(c)),)
	@echo 'ERROR: La variable "c" (comando) es obligatoria para esta regla.' >&2
	@echo '       Uso: make REGLA c="ls -al"' >&2
	@echo '' >&2
	@exit 1
endif
