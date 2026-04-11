# 🏗️ Setup
The easiest way to run the application is through the provided
Docker compose OCI image which provides a single step setup for the entire application.

- ## Prerequisite:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or any Docker CLI with OCI support) for windows or [Docker Engine](https://www.docker.com/products/docker-desktop/) + [Docker Compose](https://www.docker.com/products/docker-desktop/) for Linux.

- ## Running the Application
To run it, simply execute the following command anywhere in your terminal:

```bash
docker compose -p rarecips --env-file NUL -f oci://blasetvrtumi/rarecips:latest-compose up --abort-on-container-exit --remove-orphans && docker compose -p rarecips down -v
```

This command will pull the latest version of the application from the OCI registry and start all necessary containers, including the backend, frontend, and database.
Any valid tag that points to compose image can also be used instead of the latest tag.

- ## Accessing the Application
Once the containers are up and running, you can access the application through your web browser [here](https://localhost:8443).

By default, the application includes the following users with their respective credentials for testing purposes:

| Role   | Username | Password  |
|--------|----------|-----------|
| Admin  | admin    | adminpass |
| User   | user     | pass      |

There are also some preloaded recipes, ingredients and collections to explore the application's features right away.