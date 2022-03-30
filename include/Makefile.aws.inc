SHELL=/bin/bash

AUDIT = 986881318085
AUTOMATION = 061573364520
DNS = 468825517946
DEVPLATFORM = 994224827437
PRODPLATFORM = 562068007705
STAGEPLATFORM = 594739244103

AWS_ACCOUNT ?= $(AWS_DEFAULT_ACCOUNT)
AWS_DEFAULT_ACCOUNT ?= $(AUTOMATION)
AWS_DEFAULT_REGION ?= us-east-2
AWS_REGION ?= $(AWS_DEFAULT_REGION)

aws/ecr/tag: aws/ecr/login docker/build ## Tag an ECR docker image
	docker tag $(DOCKER_IMAGE_NAME):$(DOCKER_TAG) $(ECR_REPO_URL)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG) && \
	touch $@

aws/ecr/login: aws/ecr ## Login to account's ECR
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REPO_URL) && \
	touch $@

aws/ecr/push: aws/ecr aws/ecr/tag aws/ecr/login ## Push a docker container to ECR
	docker push $(ECR_REPO_URL)/$(DOCKER_IMAGE_NAME):$(DOCKER_TAG)
	touch $@

aws/codeartifact/login: aws/codeartifact ## Login to the a codeartifact repository (usually an npm repo)
	aws codeartifact login --tool $(CODEARTIFACT_TOOL) --domain $(CODEARTIFACT_DOMAIN) --domain-owner $(CODEARTIFACT_DOMAIN_OWNER) --repository $(CODEARTIFACT_REPO) && \
	touch $@

aws/codepipeline/source: compose-bundle.zip aws/codepipeline # Upload zip file to s3 bucket for codepipeline build
	aws s3 cp $< s3://$(CODEDEPLOY_S3_BUCKET)/$<
	touch $@

aws/ecr:
	mkdir -p $@

aws/codeartifact:
	mkdir -p $@

aws/codepipeline:
	mkdir -p $@
