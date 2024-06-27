.PHONY: env
env: ## Prepares the .env file by copying from .env.example if not present.
ifeq ($(OS),Windows_NT)
	@if not exist .env ( \
		echo "No .env file found. Creating from .env.example..." && \
		copy .env.example .env \
	)
else
	@if [ ! -f .env ]; then \
		echo "No .env file found. Creating from .env.example..."; \
		cp .env.example .env; \
	fi
endif