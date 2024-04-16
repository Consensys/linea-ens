include .env.example
-include .env

SERVICE := LINEA ENS POH
bold := $(shell tput bold)
sgr0 := $(shell tput sgr0)

help:
	@printf "\
	$(SERVICE)\n\
	\n\
	$(bold)SYNOPSIS$(sgr0)\n\
    make [COMMANDS]\n\
	\n\
	$(bold)COMMANDS$(sgr0)\n\
		$(bold)help$(sgr0)\n\
		  Shows this help message.\n\n\
		$(bold)dev$(sgr0)\n\
		  Starts the service development mode.\n\n\
		$(bold)test$(sgr0)\n\
		  Execute unit tests.\n\n\
		$(bold)dev-docker$(sgr0)\n\
		  Builds and starts the service container in development mode.\n\n\
		$(bold)dev-docker-build$(sgr0)\n\
		  Force builds and starts the service container in development mode.\n\n\
		$(bold)dev-docker-down$(sgr0)\n\
		  Stops and removes the service container.\n\n\
	"

# Dev

.PHONY: dev
dev:
	[ ! -f .env ] && cp .env.example .env || true
	pnpm run start:dev
	
.PHONY: test
test:
	pnpm run test

.PHONY: dev-docker
dev-docker:
	[ ! -f .env ] && cp .env.example .env || true
	docker-compose up $(c)

.PHONY: dev-docker-build
dev-docker-build:
	[ ! -f .env ] && cp .env.example .env || true
	docker-compose up --build $(c)

.PHONY: dev-docker-down
dev-docker-down:
	docker-compose down
