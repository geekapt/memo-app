# Memo App

Full-stack Memo App with a Node/Express backend, React/TypeScript frontend, and Docker Compose for local development.

## Contents
- `server/` - Express backend (Node.js, Mongoose)
- `client/` - React + TypeScript frontend (Create React App)
- `docker-compose.yml` - Orchestrates MongoDB, backend, and frontend containers

## Architecture (three-tier)

This project is a classic three-tier application composed of:

- Frontend (Presentation tier): the React/TypeScript app in `client/`. It provides the UI, makes HTTP requests to the backend API, and runs in a browser. When deployed via Docker Compose the frontend is built and served by a container listening on port 3000.

- Backend (Application/API tier): the Node.js + Express server in `server/`. It exposes REST API endpoints under `/api` for authentication and memo CRUD operations, handles business logic, user sessions/JWT, file uploads, and communicates with MongoDB. The backend listens on port 5000.

- Database (Data tier): MongoDB (the `mongo` service in `docker-compose.yml`). It stores users, memos and file references. The backend connects to MongoDB using the `DATABASE` environment variable. In the Docker Compose setup the backend connects to the `mongo` service by hostname.

The tiers communicate over defined network boundaries. In Docker Compose a dedicated `memo-network` bridge network connects services; the frontend talks to the backend at `http://backend:5000` inside the network, and the backend talks to `mongo` for persistence.

This separation keeps concerns clear and makes it straightforward to scale, containerize, or replace components independently.

## Prerequisites
- Docker and Docker Compose installed (Docker Desktop or Docker Engine + docker-compose)
- Git (repo already cloned)
- Node.js and npm (only required if you want to run client/server locally without Docker)

## Environment (setup before running Docker Compose)

Create a `.env` file in the repository root (next to `docker-compose.yml`) with the following variables. You can copy from `server/.env.example` and then adjust values.

Example `.env` (replace placeholders):

```
# MongoDB root user (used for the mongo container)
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=securepassword
MONGO_INITDB_DATABASE=memo-app-db

# Backend (server) env
DATABASE=mongodb://admin:securepassword@mongo:27017/memo-app-db?authSource=admin
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES=90

```

Notes:
- The `mongo` service in `docker-compose.yml` uses the `MONGO_INITDB_*` variables to create the initial database and root user.
- For the backend `DATABASE` connection string, when using Docker Compose it's convenient to point to the `mongo` service by service name (`mongo`) rather than an external host.

## Running with Docker Compose

From the repository root (where `docker-compose.yml` is located):

```bash
# build and start services in the foreground
docker compose up --build

# or to run in detached mode
docker compose up -d --build

# view logs
docker compose logs -f

# stop and remove containers
docker compose down
```

Ports exposed by the compose setup:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

Environment variables used by services (from `.env`):
- MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD, MONGO_INITDB_DATABASE
- DATABASE, JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES
- REACT_APP_API_URL is set inside the compose for the frontend to `http://backend:5000/api`

Healthchecks
- Compose config includes healthchecks for `mongo`, `backend`, and `frontend` so Compose will wait for `mongo` to become healthy before starting `backend`.

## Running locally (without Docker)

Backend (server):

```bash
cd server
npm install
# copy server/.env.example to .env and fill values
npm run dev   # runs nodemon server.js on port 5000
```

Frontend (client):

```bash
cd client
npm install
# If you use the proxy in client/package.json (it points to http://localhost:5000), you can run:
npm start
```

When running the frontend locally, set the API base URL via `REACT_APP_API_URL` if you are not using the proxy.

## Common scripts

Server (inside `server/`):
- `npm run dev` - start server with nodemon (development)
- `npm start` - start server (production)

Client (inside `client/`):
- `npm start` - start CRA dev server
- `npm run build` - build production static files into `client/build`

## Security & Cleanup
- Do NOT commit any real secrets (API keys, DB passwords) into the repo.
- If sensitive data was accidentally committed, remove it from history with `git filter-repo` or BFG and then force-push. Coordinate with collaborators.

## Troubleshooting
- If Docker Compose fails to start the backend because it can't connect to MongoDB, ensure `.env` variables are correct and `mongo` container is healthy.
- If frontend shows CORS errors when running without Docker, confirm `REACT_APP_API_URL` points to the backend and that backend CORS configuration allows requests from your origin.

## Notes on the repo state
- The `client/` directory was previously a nested Git repository; if you see a `client/.git.hidden` folder locally you can remove it with:

```bash
rm -rf client/.git.hidden
```

I added `client/.git.hidden` to `client/.gitignore` and removed it from tracking in the latest commit.

## Contribution
- Fork, create a feature branch, make changes, and open a pull request.

---

If you'd like I can also:
- Add a Makefile or simple `scripts/` to automate local dev start (e.g., `make up` to docker compose up)
- Add container health endpoints or readiness checks
- Provide sample `docker-compose.override.yml` for local development

"Happy hacking!"
