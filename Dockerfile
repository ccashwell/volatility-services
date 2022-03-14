# syntax=docker/dockerfile:1

# Stage 1 compiles typescript
FROM node:16.14.0 as ts-compile
WORKDIR /usr/src/app
RUN touch newrelic_agent.log
ARG CODEARTIFACT_AUTH_TOKEN
COPY .npmrc .npmrc
COPY package*.json ./
COPY tsconfig*.json ./
ENV NODE_ENV production
RUN npm ci --only=production
RUN rm -f .npmrc
COPY . ./
RUN npm run build

# Stage 2 compiles typescript
FROM node:16.14.0 as ts-remover
WORKDIR /usr/src/app
ENV NODE_ENV production
ARG CODEARTIFACT_AUTH_TOKEN
COPY --from=ts-compile /usr/src/app/package.json ./
COPY --from=ts-compile /usr/src/app/tsconfig*.json ./
COPY --from=ts-compile /usr/src/app/newrelic.js ./
COPY --from=ts-compile /usr/src/app/dist ./dist
COPY --from=ts-compile /usr/src/app/newrelic_agent.log ./
COPY --from=ts-compile /usr/src/app/.npmrc .npmrc
# COPY --from=ts-compile /usr/src/app/node-volatility-mfiv-internal ./node-volatility-mfiv-internal
RUN npm set-script prepare "" && \
    npm install --production && \
    npm prune --production

# FROM gcr.io/distroless/nodejs:16
FROM node:16.14.0
RUN apt-get update -y && apt-get install -y dumb-init
# RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 && \
#     dpkg -i dumb-init_1.2.5_x86_64 && \
#     rm -rf /var/cache/apt/lists
# RUN wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_arm64.deb && \
#     dpkg -i dumb-init_*.deb && \
#     rm -rf /var/cache/apt/lists
WORKDIR /usr/src/app
ENV NODE_ENV production
COPY --from=ts-remover --chown=node:node /usr/src/app ./
# COPY --from=ts-remover --chown=1000:1000 /usr/src/app ./
# USER 1000
USER node
EXPOSE 3000
ENV TS_NODE_PROJECT tsconfig.production.json
# CMD ["./node_modules/moleculer/bin/moleculer-runner.js", "dist/services"]
CMD ["dumb-init", "node", "-r", "newrelic", "-r", "tsconfig-paths/register", "./node_modules/moleculer/bin/moleculer-runner.js", "dist/services"]

