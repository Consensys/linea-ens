SERVICE := ENS WEB3SIGNER
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
		$(bold)dev-docker$(sgr0)\n\
		  Builds and starts the service container in development mode.\n\n\
		$(bold)dev-docker-build$(sgr0)\n\
		  Force builds and starts the service container in development mode.\n\n\
		$(bold)dev-docker-down$(sgr0)\n\
		  Stops and removes the service container.\n\n\
	"

# Dev

.PHONY: dev-docker
dev-docker:
	docker compose --profile debug up $(c)
	
.PHONY: dev-docker-build
dev-docker-build:
	docker compose --profile debug up $(c)

.PHONY: dev-docker-down
dev-docker-down:
	docker compose down -v
