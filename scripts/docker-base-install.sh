####
# docker-base-bootstrap.sh
#
# Part of Dockerfile's base image bootstrapping
####
echo $(cat /proc/version)

if cat /proc/version | grep -q 'Ubuntu'; then
  apt-get update -y && \
  apt-get install -y \
          dumb-init && \
  apt-get clean
else
  wget https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_arm64.deb && \
  dpkg -i dumb-init_*.deb && \
  rm -rf /var/cache/apt/lists
fi
