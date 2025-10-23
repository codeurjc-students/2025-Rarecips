@echo off
REM Move to angular folder
cd "frontend"

REM Install angular cli globally
npm "install" "-g" "@angular\cli"

REM Install dependencies
npm "install"

REM Create production build
ng "build" "--configuration" "production"

REM Move to docker folder
cd "docker"

REM Build container
docker "build" "-t" "blasetvrtumi\rarecips" "-f" "Dockerfile" "../"

REM Push image
docker "push" "blasetvrtumi\rarecips"

REM Up compose
docker-compose "-p" "rarecips" "up"