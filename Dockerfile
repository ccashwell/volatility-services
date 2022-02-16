# syntax=docker/dockerfile:1

FROM bitnami/node:16.14.0

# RUN apk add --no-cache openssh-client git
# RUN apk add --no-cache --virtual .gyp python make g++ \
#     && npm install \
#     && apk del .gyp

# RUN apk add --no-cache --virtual .gyp \
#         python3 \
#         make \
#         g++ && \
#         rm -rf /var/cache/apk/*

# RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

# RUN apk --no-cache add --virtual .builds-deps build-base python3

# RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
# RUN npm ci

# RUN apk add --no-cache --virtual .gyp \
#         python3 \
#         make \
#         g++
# COPY package.json package-lock.json ./

# RUN npm install && npm rebuild bcrypt --build-from-source && npm cache clean --force

RUN apt-get -yq update && \
    apt-get -yqq install openssh-client git

RUN mkdir -m 700 /root/.ssh; \
    touch -m 600 /root/.ssh/known_hosts; \
    ssh-keyscan github.com > /root/.ssh/known_hosts

COPY . .
# COPY the default (~/.ssh/id_rsa) ssh key into the container
ADD $HOME/.ssh/id_rsa /root/.ssh/id_rsa
# And append to the ssh config so that it's the default ssh key
RUN  echo "    IdentityFile /root/.ssh/id_rsa" >> /etc/ssh/ssh_config
RUN --mount=type=ssh git clone git@github.com:volatilitygroup/node-volatility-mfiv.git node-volatility-mfiv

# Install dependencies
# COPY package.json package-lock.json ./
# RUN npm ci
RUN npm install --save /app/node-volatility-mfiv

# RUN --mount=type=ssh npm install
# COPY tsconfig*.json ./
# COPY src ./src
RUN npm run build

# RUN npm run build \
#  && npm prune

CMD ["npm", "start"]
