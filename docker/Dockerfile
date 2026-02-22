FROM node:20.12.2 AS frontend

WORKDIR /frontend

#Copy the files needed to build with nod the angular appplication
COPY /frontend/package.json /frontend/package-lock.json /frontend/angular.json /frontend/tsconfig.app.json /frontend/tsconfig.json /frontend/tsconfig.spec.json /frontend/

RUN npm install && npm install -g @angular/cli@19.2.15

#Copy source files from the frontend folder to the container
COPY frontend/ ./

RUN ng build --configuration production

FROM eclipse-temurin:23-jdk AS build

WORKDIR /app

RUN apt-get update && apt-get install -y maven

CMD ["sh", "-c", "pwd"]

COPY backend/pom.xml /app/

COPY backend/src/ /app/src

# Clean static frontend contents
RUN rm -rf /app/src/main/resources/public

#Copy production files to resources
COPY --from=frontend /frontend/dist/rarecips/browser ./src/main/resources/public/

COPY docs/api /docs/api

RUN mvn clean package -DskipTests

FROM amazoncorretto:21

WORKDIR /app

# Add the project's jar file to the container
COPY --from=build /app/target/rarecips-0.0.1-SNAPSHOT.jar /app

# Copy the wait-for-it.sh script to /app in the docker image
RUN curl -LJO https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh && chmod +x /app/wait-for-it.sh