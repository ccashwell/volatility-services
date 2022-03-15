SHELL=/bin/bash
HOST_NAME := localhost
# DOCKER_REGISTRY=volatilitygroup DOCKER_REPOSITORY=
#  --platform linux/amd64

.PHONY: login bootstrap-npm ecr-login ecr-build ecr-tag ecr-push

ecr-deploy: login bootstrap-npm ecr-login ecr-build ecr-tag ecr-push deploy

login:
	aws codeartifact login --tool npm --domain artifacts --domain-owner 994224827437 --repository node-volatility-mfiv

bootstrap-npm: login
	export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain artifacts --domain-owner 994224827437 --query authorizationToken --output text`
	echo "@volatility-group:registry=https://artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/" > .npmrc
	echo "//artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/:always-auth=true" >> .npmrc
	echo "//artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/:_authToken=${CODEARTIFACT_AUTH_TOKEN}" >> .npmrc

ecr-login:
	aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 994224827437.dkr.ecr.us-east-2.amazonaws.com

ecr-build: ecr-login
	docker build -t compose-pipeline-volatility-services --build-arg CODEARTIFACT_AUTH_TOKEN=${CODEARTIFACT_AUTH_TOKEN} .

ecr-tag: ecr-build
	docker tag compose-pipeline-volatility-services:latest 994224827437.dkr.ecr.us-east-2.amazonaws.com/compose-pipeline-volatility-services:latest

ecr-push: ecr-tag
	docker push 994224827437.dkr.ecr.us-east-2.amazonaws.com/compose-pipeline-volatility-services:latest

deploy:
	# BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name compose-pipeline --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text`)
	# BUCKET_NAME=compose-pipeline-sourcebucket-flkosb1nynzo
	# IMAGE_URI=994224827437.dkr.ecr.us-east-2.amazonaws.com/compose-pipeline-volatility-services
	# IMAGE_TAG=latest
	zip -x dist -x copilot -x coverage -x db-data -x traefik -x node_modules -r -u compose-bundle.zip .
	# aws s3 cp compose-bundle.zip s3://${BUCKET_NAME}/compose-bundle.zip
	aws s3 cp compose-bundle.zip s3://compose-pipeline-sourcebucket-flkosb1nynzo/compose-bundle.zip

token:
	export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain artifacts --domain-owner 061573364520 --query authorizationToken --output text`

docker-build: bootstrap-npm
	docker build -t volatility-services --build-arg CODEARTIFACT_AUTH_TOKEN=${CODEARTIFACT_AUTH_TOKEN} .

# Add to .npmrc
# registry=https://artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/
# //artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/:always-auth=true
# //artifacts-994224827437.d.codeartifact.us-east-2.amazonaws.com/npm/node-volatility-mfiv/:_authToken=${CODEARTIFACT_AUTH_TOKEN}

hack:
	@echo This is only necessary while https://github.com/node-volatility-mfiv is private
	cp -R ../node-volatility-mfiv-internal ./node-volatility-mfiv-internal || (echo "cp of node-volatility-mfiv-internal failed. Make sure you have the repo and that it's adjacent to this one. $$?"; exit 1)
	chmod 0777 ./node-volatility-mfiv-internal
	chmod 0666 ./node-volatility-mfiv-internal/package.json
	sed -i '' '/"prepare": "husky install",/d' ./node-volatility-mfiv-internal/package.json || (echo "Failed to modify node-volatility-mfiv-internal/package.json. $$?"; exit 1)
	npm install ./node-volatility-mfiv-internal --save

clobber:
	rm -rf ./node-volatility-mfiv-internal

build:
	DOCKER_BUILDKIT=1 docker build -f Dockerfile -t volatility-group/volatility-services . 2>&1 | tee build.out

bootstrap:
	psql --file postgres/init.sql --port 6432 --username postgres

reset:
	psql --file postgres/reset.sql --port 6432 --username postgres

dbash:
	docker-compose exec ${SVC} bash

dlog:
	docker-compose logs -f --tail="400" ${SVC}

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