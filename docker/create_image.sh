#!/bin/bash

set -euo pipefail

MODE=${1:-dev} # default dev, options dev, release or build
FILE=""
DOCKERHUB_USER=${DOCKERHUB_USER:-}
DOCKERHUB_TOKEN=${DOCKERHUB_TOKEN:-}
RELEASE_TAG=${RELEASE_TAG:-}
BRANCH_NAME=${BRANCH:-}
DATETIME=${DATETIME:-$(date +%Y%m%d%H%M%S)}
COMMIT=${COMMIT_SHA:-}

# Clear for better debugging of possible errors
clear

# Move to angular folder
cd ../frontend

# Install angular cli globally
npm install -g @angular/cli

# Install dependencies
npm install

# Create production build
ng build --configuration production

# Move to docker folder
cd ../docker

if [ "$MODE" == "release" ] && [ -n "$RELEASE_TAG" ]; then

    # Set release tag
    MODE=$RELEASE_TAG

    # Set compose file
    FILE="docker-compose.yml"
    
    # Build container
    docker build -f Dockerfile -t "$DOCKERHUB_USER/rarecips:$MODE" -t "$DOCKERHUB_USER/rarecips:latest" ../

    # Push image latest
    docker push "$DOCKERHUB_USER/rarecips:latest"

else

    # Set compose file
    FILE="docker-compose-dev.yml"

    if [ "$MODE" == "build" ]; then
        # Set mode to datetime-commit
        MODE="${BRANCH_NAME}-$DATETIME-${COMMIT}"
    fi

    # Build container
    docker build -f Dockerfile -t "$DOCKERHUB_USER/rarecips:$MODE" ../

fi

# Push main image
docker push "$DOCKERHUB_USER/rarecips:$MODE"

# Push OCI compose file
docker compose -f $FILE -p rarecips publish "$DOCKERHUB_USER/rarecips:$MODE"