# DevOps stack (resume overview)

Minimal, production-style tooling around Chatify — enough to demo end-to-end delivery without running a full cloud bill.

## Stack at a glance

| Layer | Tool | What it does |
|-------|------|----------------|
| App packaging | **Docker** | Multi-stage image (Vite build + Node API) |
| Local runtime | **Docker Compose** | Dev (3 services) and prod (app + MongoDB) |
| Orchestration | **Kubernetes** | Kustomize manifests (`k8s/`) |
| Infrastructure as code | **Terraform** | Same stack on any K8s cluster (`terraform/`) |
| CI | **GitHub Actions** `ci.yml` | Lint, build, smoke test, Docker build, K8s + TF validate |
| CD | **GitHub Actions** `cd.yml` | Push image to GHCR; optional TF deploy |

## Resume talking points

- Containerized a full-stack Node/React app with health checks and graceful shutdown.
- Authored **Kustomize** base + local overlay (NodePort for minikube/kind/Docker Desktop).
- Managed cluster resources with **Terraform** (namespace, secrets, config, deployments, services).
- Implemented **CI/CD**: PR checks (kubeconform, `terraform validate`) and CD to **GHCR** on merge.
- Documented local and cluster workflows (`Makefile`, Compose, K8s, Terraform).

## Quick commands

```bash
# Docker
make dev          # Compose dev stack
make build        # Production image

# Kubernetes (needs cluster + image loaded)
docker build -t chatify:latest .
kubectl apply -k k8s/overlays/local
kubectl port-forward -n chatify svc/chatify 3000:80

# Terraform (needs cluster + image)
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
cd terraform && terraform init && terraform apply
```

## CD (optional)

1. Enable GitHub Packages for the repo.
2. On push to `main`, `cd.yml` publishes `ghcr.io/<owner>/chatify:<sha>`.
3. For deploy: add repo secrets `KUBE_CONFIG` (base64 kubeconfig), `JWT_SECRET`; set variable `CLIENT_URL`; run **CD → Deploy** via `workflow_dispatch`.
