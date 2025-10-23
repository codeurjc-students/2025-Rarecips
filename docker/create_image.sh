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
docker build -t blasetvrtumi/rarecips -f Dockerfile ../

# Push image
docker push blasetvrtumi/rarecips

# Up compose
docker-compose -p rarecips up