#!/bin/bash

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

# Build container
docker build -t blasetvrtumi/rarecips:dev -f Dockerfile ../

# Push image to dev tag
docker push blasetvrtumi/rarecips:dev

# Up compose
docker compose -f docker-compose-dev.yml -p rarecips up -d