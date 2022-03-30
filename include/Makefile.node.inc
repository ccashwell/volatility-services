SHELL=/bin/bash

TYPESCRIPT_SOURCES = $(shell find . -name "*.ts" -not -path "./infrastructure/*" -not -path "./node_modules/*" -not -path "./infra/*" -not -path "./test/*" -not -path "./dist/*")
JAVASCRIPT_SOURCES = $(wildcard "mixins/*.mixin.js") newrelic.js ormconfig.js
BUILD_DEPS = Dockerfile package.json package-lock.json .dockerignore .eslintignore .eslintrc.js tsconfig.json scripts/ postgres/ .prettierrc .prettierignore tsconfig.build.json tsconfig.production.json
BUILD_FILES = $(BUILD_DEPS) $(TYPESCRIPT_SOURCES) $(JAVASCRIPT_SOURCES)

node_modules: .npmrc package.json
	npm install && \
	touch node_modules

dist: node_modules $(BUILD_FILES)
	npm run build
