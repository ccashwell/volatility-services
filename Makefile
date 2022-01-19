SHELL=/bin/bash
HOST_NAME := localhost

bootstrap:
	psql -f postgres/init.sql

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