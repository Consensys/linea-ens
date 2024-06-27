.PHONY: network
network: ## Creates the Docker network if it does not exist.
	@if ! docker network ls | grep -q $(NETWORK_NAME); then \
		echo "Creating $(NETWORK_NAME)..." ; \
		docker network create $(NETWORK_NAME); \
	fi