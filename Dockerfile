# syntax=docker/dockerfile:1

# Stage 1 compiles typescript
FROM node:16.14.0 as ts-compile
ARG CODEARTIFACT_AUTH_TOKEN
COPY package*.json .npmrc /usr/src/app/
WORKDIR /usr/src/app
RUN npm ci && \
    rm -f .npmrc
COPY services/ services
COPY src/ src
COPY mixins/ mixins
COPY typings/ typings
COPY moleculer.config.ts ormconfig.js newrelic.js tsconfig*.json ./
RUN npm run build
RUN cp services/*.js dist/services/
RUN rm -rf node_modules

# Stage 2 compiles typescript
FROM node:16.14.0 as ts-remover
ENV NODE_ENV=production
COPY .npmrc /usr/src/app/
WORKDIR /usr/src/app
COPY --from=ts-compile /usr/src/app/newrelic.js ./
COPY --from=ts-compile /usr/src/app/package.json ./
COPY --from=ts-compile /usr/src/app/tsconfig*.json ./
COPY --from=ts-compile /usr/src/app/dist ./dist

ARG CODEARTIFACT_AUTH_TOKEN
RUN npm set-script prepare "" && \
    npm install --production && \
    npm prune --production && \
    npm rm .npmrc
RUN touch newrelic_agent.log

# FROM gcr.io/distroless/nodejs:16
FROM node:16.14.0
ENV NODE_ENV=production
# RUN apt-get update -y && apt-get install -y dumb-init
# RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 && \
#     dpkg -i dumb-init_1.2.5_x86_64 && \
#     rm -rf /var/cache/apt/lists
RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_arm64.deb && \
    dpkg -i dumb-init_*.deb && \
    rm -rf /var/cache/apt/lists
WORKDIR /usr/src/app
# COPY --from=ts-remover --chown=1000:1000 /usr/src/app ./
# USER 1000
USER node
EXPOSE 3000
ENV TS_NODE_PROJECT=tsconfig.production.json
COPY --from=ts-remover --chown=node:node /usr/src/app ./
# CMD ["./node_modules/moleculer/bin/moleculer-runner.js", "dist/services"]
CMD ["dumb-init", "node", "-r", "newrelic", "-r", "tsconfig-paths/register", "./node_modules/moleculer/bin/moleculer-runner.js", "dist/services"]
