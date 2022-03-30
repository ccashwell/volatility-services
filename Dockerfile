# syntax=docker/dockerfile:1

FROM public.ecr.aws/docker/library/node:16.14.0 as base
WORKDIR /usr/src/app
EXPOSE 3000
RUN mkdir -p /etc/newrelic-infra/logging.d/
COPY ./etc/newrelic-infra/logging.d/logs.yaml /etc/newrelic-infra/logging.d/logs.yaml
COPY newrelic.js .
COPY ormconfig.js .
COPY scripts/ scripts
RUN sh scripts/docker-base-install.sh
COPY package.json .

# Stage 1 compiles typescript
FROM base as dependencies
WORKDIR /usr/src/app
COPY package*.json .npmrc ./
ARG CODEARTIFACT_AUTH_TOKEN
RUN npm set progress=false && \
    npm config set depth
RUN npm install --only=production
RUN cp -R node_modules prod_node_modules
RUN npm install && \
    rm -f .npmrc

FROM dependencies as ts-compile
WORKDIR /usr/src/app
# COPY --from=dependencies /usr/src/app/node_modules /usr/src/app/node_modules
COPY moleculer.config.ts .
COPY tsconfig*.json ./
COPY typings/ ./typings
COPY mixins/ ./mixins
COPY src/ ./src
COPY services/ ./services
RUN npm run build && \
    rm -rf node_modules

# Stage 2 compiles typescript
FROM ts-compile as ts-remover
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src/app/package*.json ./
COPY --from=ts-compile /usr/src/app/tsconfig*.json ./
COPY --from=ts-compile /usr/src/app/dist ./dist
# COPY .npmrc /usr/src/app/
# ARG CODEARTIFACT_AUTH_TOKEN
# RUN npm set-script prepare "" && \
#     npm install --production && \
#     npm prune --production && \
#     npm rm .npmrc

# FROM gcr.io/distroless/nodejs:16
# FROM gcr.io/distroless/nodejs:16
FROM base as production
ENV TS_NODE_PROJECT=tsconfig.production.json
WORKDIR /usr/src/app
RUN touch newrelic_agent.log
COPY --from=dependencies /usr/src/app/prod_node_modules /usr/src/app/node_modules
COPY --from=ts-remover /usr/src/app /usr/src/app
RUN ls -ltrha
CMD ["dumb-init", "node", "-r", "newrelic", "-r", "tsconfig-paths/register", "./node_modules/moleculer/bin/moleculer-runner.js", "--env", "--config", "dist/moleculer.config.js", "dist/services"]

# ENV NODE_ENV=production
# RUN apt-get update -y && apt-get install -y dumb-init
# RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 && \
#     dpkg -i dumb-init_1.2.5_x86_64 && \
#     rm -rf /var/cache/apt/lists
# RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_arm64.deb && \
#     dpkg -i dumb-init_*.deb && \
#     rm -rf /var/cache/apt/lists
# WORKDIR /usr/src/app
# # COPY --from=ts-remover --chown=1000:1000 /usr/src/app ./
# # USER 1000
# USER node
# ENV TS_NODE_PROJECT=tsconfig.production.json
# COPY --from=ts-remover --chown=node:node /usr/src/app ./
# # CMD ["./node_modules/moleculer/bin/moleculer-runner.js", "dist/services"]
# CMD ["dumb-init", "node", "-r", "newrelic", "-r", "tsconfig-paths/register", "./node_modules/moleculer/bin/moleculer-runner.js", "--env", "--config", "dist/moleculer.config.js", "dist/services"]
