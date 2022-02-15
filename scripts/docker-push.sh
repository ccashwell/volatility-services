USERNAME=$(whoami)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Pushing docker image: $DOCKER_REGISTRY/$DOCKER_REPOSITORY:$USERNAME-$BRANCH"
docker push "$DOCKER_REGISTRY"/"$DOCKER_REPOSITORY":"$USERNAME"-"$BRANCH"

