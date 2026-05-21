# Chatify

A full-stack real-time chat app inspired by Chatify. This repo contains a Node.js/Express backend with Socket.IO and a React/Vite frontend.

## Features

- JWT signup/login/logout flow
- Real-time private messaging
- Online/offline presence
- Typing indicators
- Unread message badges
- Profile picture updates
- Image messages
- Welcome email support
- Cloudinary image uploads
- Production static serving from the backend

## Project Structure

- `Backend/` - Express API, MongoDB, Socket.IO, email and upload integrations
- `Frontend/` - React UI, routing, stores, chat views

## Requirements

- Node.js 18+
- MongoDB
- Optional: Cloudinary, Resend

## Setup

### 1. Backend environment

Create `Backend/.env` from `Backend/.env.example` and fill in the values.

Minimum required values:

```bash
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/chat_app
JWT_SECRET=your_secure_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Optional integrations:

```bash
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_email@example.com
EMAIL_FROM_NAME=Chatify

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Install dependencies

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### 3. Run in development

Start the backend:

```bash
cd Backend
npm run dev
```

Start the frontend:

```bash
cd Frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and backend on `http://localhost:3000`.

## Production

Build the frontend:

```bash
cd Frontend
npm run build
```

Then start the backend with production env values:

```bash
cd Backend
npm start
```

In production, the backend serves the built frontend from `Frontend/dist`.

## DevOps

Resume-friendly minimal stack: **Docker · Docker Compose · Kubernetes (Kustomize) · Terraform · GitHub Actions CI/CD**.

See **[docs/DEVOPS.md](docs/DEVOPS.md)** for a one-page overview and interview talking points.

### Docker & Compose

```bash
make dev          # MongoDB + API + Vite (ports 5173 / 3000)
make prod         # Single production image + MongoDB (port 3000)
make build        # docker build -t chatify:latest .
```

### Kubernetes

```bash
make build
make k8s-apply    # minikube / kind / Docker Desktop K8s
# NodePort: http://localhost:30080  (or port-forward — see docs/DEVOPS.md)
```

Manifests: `k8s/base` + `k8s/overlays/local`.

### Terraform

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
make tf-init && make tf-apply
```

Provisions the same app on any cluster reachable via `~/.kube/config`.

### CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR / push | Lint, build, smoke test, Docker build, Kustomize + kubeconform, `terraform validate` |
| `cd.yml` | push `main` | Push image to **GHCR**; optional K8s deploy via `workflow_dispatch` |

Local checks: `make ci`

### Health checks

`GET /api/health` — API + MongoDB readiness (used by Docker, Kubernetes probes).

### Environment files

| File | Purpose |
|------|---------|
| `Backend/.env.example` | Local/manual backend run |
| `Frontend/.env.example` | Vite dev (`VITE_API_URL`) |
| `.env.example` | Docker production compose |
| `terraform/terraform.tfvars.example` | Terraform variables |

## Notes

- If Cloudinary keys are not configured, image upload features will not persist to Cloudinary.
- If Resend is not configured, signup still works and email sending is skipped safely.
- The app uses token-based auth stored locally in the browser for development convenience.

## Scripts

### Backend

- `npm run dev` - start the API with nodemon
- `npm start` - start the API with node

### Frontend

- `npm run dev` - start Vite dev server
- `npm run build` - build production assets
- `npm run lint` - run ESLint

## License

For personal and educational use unless you add a license.
