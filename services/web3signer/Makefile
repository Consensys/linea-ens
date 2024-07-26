SERVICE := ENS WEB3SIGNER
NETWORK_NAME := ens-network
SHOW_DOCKER_HELP := true

include .makefiles/help.mk
include .makefiles/env.mk
include .makefiles/network.mk

default: help

# Development Commands

.PHONY: dev-docker
dev-docker: network ## Builds and starts the service container in development mode.\n Optionally, use Docker Compose options.
	docker compose --profile debug up $(c)

.PHONY: dev-docker-build
dev-docker-build: network ## Force builds and starts the service container in development mode.\n Optionally, use Docker Compose options.
	docker compose --profile debug up --build $(c)

.PHONY: dev-docker-down
dev-docker-down: ## Stops and removes the service container.
	docker compose down
