#!/bin/bash
set -euo pipefail

TAG=${1:-dev-compose}
DOCKERHUB_USER=${DOCKERHUB_USER:-blasetvrtumi}
DEPLOYED_DOMAIN=${DEPLOYED_DOMAIN:-https://rarecips.spaincentral.cloudapp.azure.com/}

echo "Deploying OCI package: ${DOCKERHUB_USER}/rarecips:${TAG}..."

# Pull OCI compose
docker pull "${DOCKERHUB_USER}/rarecips:${TAG}"

# Run OCI
docker compose -p rarecips -f "oci://docker.io/${DOCKERHUB_USER}/rarecips:${TAG}" up -y -d

# Healthchecks
echo "Waiting for the application to be healthy locally..."
until curl -s -f -o /dev/null http://localhost:8443/; do
  sleep 3
done
echo "Application is healthy locally"

echo "Waiting for the application to be healthy externally..."
until curl -s -f -o /dev/null "${DEPLOYED_DOMAIN}"; do
  sleep 3
done
echo "Application is healthy externally"

# Clean up
docker system prune -f
