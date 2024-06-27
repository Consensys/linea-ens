# Detect the operating system
ifeq ($(OS),Windows_NT)
    LINE_BREAK = @echo.
else
    LINE_BREAK = @echo ""
endif

.PHONY: help
help: ## Show this help.
	@echo $(SERVICE)
	@$(LINE_BREAK)
	@echo Usage: make [command]
	@$(LINE_BREAK)
	@echo Commands:
	@awk -F ':|##' '/^[a-zA-Z0-9_-]+:.*##/ { \
		split($$3, lines, "\\\\n"); \
		printf "  %-25s %s\n", $$1, lines[1]; \
		for (i = 2; i <= length(lines); i++) { \
			printf "%-28s%s\n", "", lines[i]; \
		} \
	}' $(MAKEFILE_LIST)
	@$(LINE_BREAK)
ifeq ($(SHOW_DOCKER_HELP), true)
	@awk 'BEGIN { \
        print "Docker options:"; \
        print "  & \t Run containers in the background."; \
        print "\t Example: make dev-docker &"; \
    }'
	@$(LINE_BREAK)
endif