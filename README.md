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

- Database (Data tier): MongoDB (the `mongo` service in `docker-compose.yml` or `mongodb` service in K8s). It stores users, memos and file references. The backend connects to MongoDB using the `DATABASE` environment variable.

The tiers communicate over defined network boundaries:
*   **Docker Compose**: A dedicated `memo-network` bridge network connects services.
*   **Kubernetes**:
    *   **Ingress**: Entry point (`memo-app.local`) routing traffic to services.
    *   **Services**: `memo-app-frontend` (NodePort/ClusterIP) and `memo-app-backend` (ClusterIP).
    *   **Pods**: Ephemeral containers running the application logic.

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
MONGO_INITDB_ROOT_USERNAME=memo_admin
MONGO_INITDB_ROOT_PASSWORD=memo_password123
MONGO_INITDB_DATABASE=memo-app-db

# Backend (server) env
DATABASE=mongodb://memo_admin:memo_password123@mongo:27017/memo-app-db?authSource=admin
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
- REACT_APP_API_URL is set inside the compose for the frontend to `http://localhost:5000/api`

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
- **MongoDB Authentication Failed**: If you see "Authentication failed" or "UserNotFound", it means the database volume contains old data. You MUST reset the volume:
  ```bash
  docker compose down -v
  docker compose up --build
  ```
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

## Kubernetes Deployment

This project includes a complete Kubernetes configuration in the `k8s/` directory.

### Prerequisites

1.  **Kubernetes Cluster**: Minikube, Kind, or a cloud provider.
2.  **Ingress Controller**: Required for domain-based routing.
    ```bash
    # For Kind/Cloud (standard):
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
    
    # For Minikube:
    minikube addons enable ingress
    ```

### 1. Secrets Configuration

Sensitive data is stored in Kubernetes Secrets. The values must be **base64 encoded**.

*   `k8s/mongodb/secrets.yml`: Database root credentials (`mongo-root-username`, `mongo-root-password`).
*   `k8s/server/secrets.yml`: Backend config (`database-url`, `jwt-secret`).

To encode a value:
```bash
echo -n "your_value" | base64
```

### 2. Deploying the Application

Run the following commands in order:

```bash
# 1. Create Namespace
kubectl apply -f k8s/namespace.yml

# 2. Deploy MongoDB (Storage, Secrets, Deployment, Service)
kubectl apply -f k8s/mongodb/

# 3. Deploy Backend (Secrets, Deployment, Service)
kubectl apply -f k8s/server/

# 4. Deploy Frontend (Deployment, Service)
kubectl apply -f k8s/client/

# 5. Configure Ingress (Routing)
kubectl apply -f k8s/ingress.yml
```

### 3. Accessing the App

#### Option A: Ingress (Recommended)
1.  Add the domain to your `/etc/hosts`:
    ```
    127.0.0.1 memo-app.local
    ```
2.  **Important**: If running locally (Kind/Minikube) without a LoadBalancer IP, you must port-forward the Ingress Controller:
    ```bash
    kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80
    ```
3.  Access at: `http://memo-app.local:8080`

#### Option B: NodePort (Direct Access)
The frontend service is exposed via NodePort `30000`.
*   Access at: `http://localhost:30000` (or your Node IP).

### 4. Troubleshooting

*   **Frontend API Connection**:
    *   Ensure `client/src/App.tsx` and `client/src/contexts/AuthContext.tsx` use a relative path:
        ```javascript
        axios.defaults.baseURL = '/api/v1';
        ```
    *   If using the old image with hardcoded `localhost:5000`, you must port-forward the backend:
        ```bash
        kubectl port-forward -n memo-app service/memo-app-backend 5000:5000
        ```

*   **MongoDB Connection**:
    *   To debug database issues, exec into the MongoDB pod:
        ```bash
        kubectl exec -it -n memo-app <mongodb-pod-name> -- bash
        ```
    *   Connect using `mongosh` (note the hostname `mongodb` matches the K8s service name):
        ```bash
        mongosh "mongodb://memo_admin:memo_password123@mongodb:27017/memo-app-db?authSource=admin"
        ```

*   **HTTPS Redirects**:
    *   The Ingress is configured to disable SSL redirects (`nginx.ingress.kubernetes.io/ssl-redirect: "false"`) to allow plain HTTP access. Clear your browser cache if you get forced to HTTPS.

---

## Development Log & Issues Resolved

This section tracks the challenges faced during the DevOps implementation and their solutions.

### 1. CI/CD Pipeline (GitLab CI)
*   **Issue**: `docker push` permission denied.
    *   **Fix**: Authenticated using `docker login` with `CI_REGISTRY_USER` and `CI_REGISTRY_PASSWORD`.
*   **Issue**: `docker scan` command not found.
    *   **Fix**: Replaced with `trivy image` for vulnerability scanning.
*   **Issue**: YAML syntax errors in `.gitlab-ci.yml`.
    *   **Fix**: Corrected indentation and job dependencies.

### 2. Docker & Security
*   **Issue**: Frontend running as root.
    *   **Fix**: Updated `client/Dockerfile` to use a multi-stage build with Nginx running as a non-root user (port 8080).
*   **Issue**: MongoDB authentication failures ("UserNotFound").
    *   **Fix**: Added troubleshooting step to reset volumes (`docker compose down -v`) to clear old uninitialized data.

### 3. Kubernetes Migration
*   **Issue**: `apiVersion` mismatch (`Deployment` in `v1`).
    *   **Fix**: Updated manifests to use `apps/v1`.
*   **Issue**: Frontend port mismatch.
    *   **Fix**: Updated `client/deploy.yml` and `service.yml` to use port **8080** (matching the non-root Nginx container) instead of 80.
*   **Issue**: "Connection Refused" / CORS errors.
    *   **Fix**: Frontend URL was hardcoded to `localhost:5000`. Updated `App.tsx` to use relative path `/api/v1` to route through Ingress.
*   **Issue**: Ingress forced HTTPS redirect.
    *   **Fix**: Added `nginx.ingress.kubernetes.io/ssl-redirect: "false"` annotation to allow HTTP access.

