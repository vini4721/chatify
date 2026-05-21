.PHONY: help dev dev-down prod prod-down build ci lint k8s-apply k8s-delete tf-init tf-plan tf-apply

help:
	@echo "Targets:"
	@echo "  make dev          - Docker Compose dev stack"
	@echo "  make prod         - Docker Compose production stack"
	@echo "  make build        - Build chatify:latest image"
	@echo "  make k8s-apply    - Deploy to Kubernetes (local overlay)"
	@echo "  make tf-apply     - Deploy with Terraform"
	@echo "  make ci           - Local CI (frontend lint/build + backend install)"

dev:
	docker compose up --build

dev-down:
	docker compose down

prod:
	docker compose -f docker-compose.prod.yml --env-file .env up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down

build:
	docker build -t chatify:latest .

k8s-apply:
	kubectl apply -k k8s/overlays/local

k8s-delete:
	kubectl delete -k k8s/overlays/local --ignore-not-found

tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan

tf-apply:
	cd terraform && terraform apply

ci:
	cd Frontend && npm ci && npm run lint && npm run build
	cd Backend && npm ci

lint:
	cd Frontend && npm run lint
