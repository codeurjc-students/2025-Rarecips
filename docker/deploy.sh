#!/bin/bash
set -euo pipefail

TAG=${1:-dev-compose}
DOCKERHUB_USER=${DOCKERHUB_USER:-blasetvrtumi}

echo "Deploying OCI package: ${DOCKERHUB_USER}/rarecips:${TAG}..."

# Pull OCI compose
docker pull "${DOCKERHUB_USER}/rarecips:${TAG}"

# Run OCI
docker compose -p rarecips -f "oci://docker.io/${DOCKERHUB_USER}/rarecips:${TAG}" up -y -d

# Clean up
docker system prune -f
