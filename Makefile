DEPTH=.
SHELL=/bin/bash
INCLUDE_DIR=include

include $(DEPTH)/$(INCLUDE_DIR)/Makefile.aws.inc
include $(DEPTH)/$(INCLUDE_DIR)/Makefile.node.inc

HOST_NAME := localhost

# AUDIT = 986881318085
# AUTOMATION = 061573364520
# DNS = 468825517946
# DEVPLATFORM = 994224827437
# PRODPLATFORM = 562068007705
# STAGEPLATFORM = 594739244103

GITHUB_ORG ?= VolatilityGroup
GITHUB_REPO ?= volatility-services

DOCKER_TAG ?= latest
DOCKER_IMAGE_NAME ?= $(ECR_REPO_URL)/$(GITHUB_REPO):$(DOCKER_TAG)

CODEARTIFACT_DOMAIN ?= artifacts
CODEARTIFACT_DOMAIN_OWNER ?= $(AUTOMATION)
CODEARTIFACT_REPO ?= npm/npm-store
CODEARTIFACT_URL ?= artifacts-$(CODEARTIFACT_DOMAIN_OWNER).d.codeartifact.$(AWS_REGION).amazonaws.com
CODEARTIFACT_TOOL ?= npm

CODEDEPLOY_S3_BUCKET ?= compose-pipeline-sourcebucket-flkosb1nynzo

ECR_REPO_URL = $(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com


# TS_SOURCES := $(wildcard *.ts src/*.ts src/datasources/*.ts src/clients/*.ts src/configuration/*.ts src/lib/*.ts src/lib/errors/*.ts)
TYPESCRIPT_SOURCES = $(shell find . -name "*.ts" -not -path "./infrastructure/*" -not -path "./node_modules/*" -not -path "./infra/*" -not -path "./test/*" -not -path "./dist/*")
JAVASCRIPT_SOURCES = $(wildcard "mixins/*.mixin.js") newrelic.js ormconfig.js

BUILD_DEPS = Dockerfile package.json package-lock.json .dockerignore .eslintignore .eslintrc.js tsconfig.json scripts/ postgres/ .prettierrc .prettierignore tsconfig.build.json tsconfig.production.json

# DOCKER_SOURCES := $(.env package.json package-lock.json .dockerignore)
# DOCKER_REGISTRY=volatilitygroup DOCKER_REPOSITORY=
#  --platform linux/amd64
BUILD_FILES = $(BUILD_DEPS) $(TYPESCRIPT_SOURCES) $(JAVASCRIPT_SOURCES)

.PHONY: all install clean build login ecr-login ecr-build ecr-tag ecr-push bootstrap-pipeline debug

all: node_modules .npmrc docker/build aws/ecr/tag aws/ecr/push

install: node_modules

build: dist

deploy: aws/ecr/push
# dist: node_modules $(BUILD_FILES)
# 	npm run build

clean:
	rm -rfv node_modules package-lock.json dist

# node_modules: .npmrc package.json
# 	npm install && \
# 	touch node_modules

.npmrc: aws/codeartifact/login
	$(eval CODEARTIFACT_AUTH_TOKEN=$(shell aws codeartifact get-authorization-token --domain $(CODEARTIFACT_DOMAIN) --domain-owner $(CODEARTIFACT_DOMAIN_OWNER) --query authorizationToken --output text))
	echo "@volatility-group:registry=https://$(CODEARTIFACT_URL)/npm/$(CODEARTIFACT_REPO)/" > .npmrc
	echo "//$(CODEARTIFACT_URL)/npm/$(CODEARTIFACT_REPO)/:always-auth=true" >> .npmrc
	echo "//$(CODEARTIFACT_URL)/npm/$(CODEARTIFACT_REPO)/:_authToken=$(CODEARTIFACT_AUTH_TOKEN)" >> .npmrc

docker/build: docker Dockerfile .env .npmrc package.json package-lock.json .dockerignore
	docker build -t $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) --build-arg CODEARTIFACT_AUTH_TOKEN=${CODEARTIFACT_AUTH_TOKEN} . && \
	touch docker/build

# aws/ecr/tag: aws/ecr/login docker/build
# 	docker tag $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) $(ECR_REPO_URL)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG) && \
# 	touch $@

# aws/ecr/login: aws/ecr
# 	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REPO_URL) && \
# 	touch $@

# aws/ecr/push: aws/ecr aws/ecr/tag aws/ecr/login
# 	docker push $(ECR_REPO_URL)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
# 	touch $@

# aws/codeartifact/login: aws/codeartifact
# 	aws codeartifact login --tool $(CODEARTIFACT_TOOL) --domain $(CODEARTIFACT_DOMAIN) --domain-owner $(CODEARTIFACT_DOMAIN_OWNER) --repository $(CODEARTIFACT_REPO) && \
# 	touch $@

docker:
	mkdir -p $@

# aws/ecr:
# 	mkdir -p $@

# aws/codeartifact:
# 	mkdir -p $@

# aws/codepipeline:
# 	mkdir -p $@

compose-bundle.zip: $(BUILD_FILES)
	zip -x dist/**\* -r -u $@ $^

# aws/codepipeline/source: compose-bundle.zip aws/codepipeline
# 	aws s3 cp $< s3://$(CODEDEPLOY_S3_BUCKET)/$<
# 	touch $@
# ecr-deploy: login bootstrap-npm ecr-login ecr-build ecr-tag ecr-push

# prod-ecr-login:
# 	aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 562068007705.dkr.ecr.us-east-2.amazonaws.com/volatility-services-codepipeline-volatility-services:latest

# ecr-build: ecr-login
# 	docker build -t volatility-services:latest --build-arg CODEARTIFACT_AUTH_TOKEN=${CODEARTIFACT_AUTH_TOKEN} .

# ecr-push: ecr-tag
# 	docker push 994224827437.dkr.ecr.us-east-2.amazonaws.com/volatility-services:latest

# deploy:
# 	# BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name compose-pipeline --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text`)
# 	# BUCKET_NAME=compose-pipeline-sourcebucket-flkosb1nynzo
# 	# IMAGE_URI=994224827437.dkr.ecr.us-east-2.amazonaws.com/compose-pipeline-volatility-services
# 	# IMAGE_TAG=latest
# 	zip -x .git/**\* dist/**\* copilot/**\* coverage/**\* db-data/**\* traefik/**\* node_modules/**\* infrastructure/**\* private/**\* -r -u compose-bundle.zip .
# 	# aws s3 cp compose-bundle.zip s3://${BUCKET_NAME}/compose-bundle.zip
# 	aws s3 cp compose-bundle.zip s3://compose-pipeline-sourcebucket-flkosb1nynzo/compose-bundle.zip

# token:
# 	export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain artifacts --domain-owner 061573364520 --query authorizationToken --output text`

# docker-build: .npmrc
# 	docker build -t volatility-services-refactor --build-arg CODEARTIFACT_AUTH_TOKEN=${CODEARTIFACT_AUTH_TOKEN} .

# Add to .npmrc
# registry=https://artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/
# //artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/:always-auth=true
# //artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/:_authToken=${CODEARTIFACT_AUTH_TOKEN}

# hack:
# 	@echo This is only necessary while https://github.com/node-volatility-mfiv is private
# 	cp -R ../node-volatility-mfiv-internal ./node-volatility-mfiv-internal || (echo "cp of node-volatility-mfiv-internal failed. Make sure you have the repo and that it's adjacent to this one. $$?"; exit 1)
# 	chmod 0777 ./node-volatility-mfiv-internal
# 	chmod 0666 ./node-volatility-mfiv-internal/package.json
# 	sed -i '' '/"prepare": "husky install",/d' ./node-volatility-mfiv-internal/package.json || (echo "Failed to modify node-volatility-mfiv-internal/package.json. $$?"; exit 1)
# 	npm install ./node-volatility-mfiv-internal --save

# clobber:
# 	rm -rf ./node-volatility-mfiv-internal

# build:
# 	DOCKER_BUILDKIT=1 docker build -f Dockerfile -t volatility-group/volatility-services . 2>&1 | tee build.out

# bootstrap-pipeline:
# 	cd infrastructure/cdk && \
# 	npm ci && \
# 	npm run build
# 	npx cdk synth VgCodePipelineStack

# bootstrap:
# 	psql --file postgres/init.sql --port 6432 --username postgres

# reset:
# 	psql --file postgres/reset.sql --port 6432 --username postgres

# dbash:
# 	docker-compose exec ${SVC} bash

# dlog:
# 	docker-compose logs -f --tail="400" ${SVC}

generate-ssm-secrets:
	aws ssm put-parameter \
    --name /volatility-services/dev/GITHUB_OWNER \
    --type String \
    --value VolatilityGroup && \
	aws ssm put-parameter \
			--name /volatility-services/dev/GITHUB_REPO \
			--type String \
			--value volatility-services && \
	aws secretsmanager create-secret \
			--name /volatility-services/dev/GITHUB_TOKEN \
			--secret-string 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 && \
	aws secretsmanager create-secret \
			--name /volatility-services/prod/GITHUB_TOKEN \
			--secret-string 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
	aws secretsmanager create-secret \
			--name /volatility-services/dev/GITHUB_TOKEN \
			--secret-string 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
	aws secretsmanager create-secret \
			--name /volatility-services/dev/GITHUB_TOKEN \
			--secret-string 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
	# arn:aws:secretsmanager:us-east-2:061573364520:secret:github-token-WVOJ8x
	aws secretsmanager create-secret \
		--name github-token \
		--secret-string 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

aurora-support:
	# aws rds describe-orderable-db-instance-options --engine aurora-postgresql --db-instance-class db.t3.medium --query 'OrderableDBInstanceOptions[].EngineVersion'
	aws rds describe-orderable-db-instance-options --engine aurora-postgresql  \
    --query "OrderableDBInstanceOptions[].{DBInstanceClass:DBInstanceClass,SupportedEngineModes:SupportedEngineModes[0],EngineVersion:EngineVersion}" \
    --output table \
    --region us-east-2

make-keypair:
	aws ec2 create-key-pair --key-name vg-ue2-${STAGE}-ssm-instance-keypair --query 'KeyMaterial' --output text > ~/.ssh/vg-ue2-${STAGE}-ssm-instance-keypair.pem

bootstrap-cdk:
	export CDK_NEW_BOOTSTRAP=1 && \
	npx cdk bootstrap aws://$(PRODPLATFORM)/us-east-2 \
					--cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
					--trust $(AUTOMATION)

ifneq ($(HOST_NAME),-)
setup-local-certs:
	@echo ---------------
	@echo - Heads up, this will only work on Mac. Please refer to:
	@echo - https://mkcert.dev for other platforms
	@echo ---------------
	@brew install mkcert nss
	@- cd traefik && mkdir certs
	@echo Creating certificates
	mkcert -cert-file traefik/certs/certs-cert.pem -key-file traefik/certs/certs-key.pem ${HOST_NAME} "*.${HOST_NAME}"
	@echo Installing certificates
	cd traefik/certs && mkcert -cert-file certs-cert.pem -key-file certs-key.pem --install
	@echo Certificates installed!
else
setup-local-certs:
	@echo ---------------
	@echo - Only run this if the HOST_NAME in your .env has been set!
	@echo - Heads up, this will only work on Mac. Please refer to:
	@echo - https://mkcert.dev for other platforms
	@echo ---------------
endif