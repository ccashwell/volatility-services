USERNAME=$(whoami)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Building docker image: $DOCKER_REGISTRY/$DOCKER_REPOSITORY:$USERNAME-$BRANCH"
docker build -t "$DOCKER_REGISTRY"/"$DOCKER_REPOSITORY":"$USERNAME"-"$BRANCH" .