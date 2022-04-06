#!/bin/bash
set -o nounset
set -o errexit

####
# docker-base-bootstrap.sh
#
# Part of Dockerfile's base image bootstrapping
####
echo Check OS versions...
OS_VERSION=$(cat /proc/version)
echo $OS_VERSION
echo $(uname -a)

if echo $OS_VERSION | grep -q 'Ubuntu';
then
  echo OS is Ubuntu && \
  apt-get update -y && \
  apt-get install -y \
          dumb-init && \
  apt-get clean
elif echo $OS_VERSION | grep -q 'Alpine';
then
  echo OS is Alphine/Debian && \
  apk add --no-cache --virtual .builds-deps build-base python3 bash && \
  wget https://github.com/Yelp/dumb-init/archive/refs/tags/v1.2.5.tar.gz && \
  tar -xvf v1.2.5.tar.gz && \
  cd dumb-init-1.2.5 && \
  make && \
  mv dumb-init .. && \
  cd .. && \
  rm -rf .builds-deps && \
  rm -rf v1.2.5.tar.gz && \
  rm -rf dumb-init-1.2.5 && \
  echo cp $PWD/dumb-init ...
elif echo $OS_VERSION | grep -q 'amzn2';
then
  echo OS is Amazon Linux 2 && \
  mkdir -p /etc/newrelic-infra/logging.d/ && \
  apt update -y && \
  apt install build-essential build-base python3 bash && \
  wget https://github.com/Yelp/dumb-init/archive/refs/tags/v1.2.5.tar.gz && \
  tar -xvf v1.2.5.tar.gz && \
  cd dumb-init-1.2.5 && \
  make && \
  mv dumb-init .. && \
  cd .. && \
  rm -rf .builds-deps && \
  rm -rf v1.2.5.tar.gz && \
  rm -rf dumb-init-1.2.5 && \
  echo cp $PWD/dumb-init ...
else
  echo OS is other && \
  wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_arm64.deb && \
  dpkg -i dumb-init_*.deb && \
  rm -rf /var/cache/apt/lists
fi
