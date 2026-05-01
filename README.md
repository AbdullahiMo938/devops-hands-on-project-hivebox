# HiveBox Global Temperature API

HiveBox is a cloud-native Node.js application that aggregates global environmental sensor data from the OpenSenseMap API, processes temperature readings, and exposes monitoring and storage functionality through REST APIs.

The project demonstrates modern backend engineering and DevOps practices including containerisation, Kubernetes deployment, Helm-based releases, CI/CD automation, observability, caching, and cloud infrastructure integration.

---

# Features

- REST API built with Express.js
- Global temperature aggregation using OpenSenseMap data
- Redis / Valkey caching layer
- Prometheus metrics endpoint for observability
- Scheduled data archiving with cron jobs
- S3-compatible object storage integration (MinIO)
- Docker containerisation
- Kubernetes + Helm deployment support
- GitHub Actions CI/CD pipeline
- Amazon EKS deployment workflow
- Health and version endpoints

---

# Architecture Overview

```text
Users
   │
   ▼
HiveBox API (Node.js / Express)
   │
   ├── OpenSenseMap API
   ├── Redis / Valkey Cache
   ├── MinIO Object Storage
   └── Prometheus Metrics

CI/CD Pipeline
   │
   ├── GitHub Actions
   ├── Docker Build
   ├── GHCR Image Registry
   └── Helm Deployment to Amazon EKS
```

---

# Tech Stack

## Backend
- Node.js
- Express.js

## DevOps & Infrastructure
- Docker
- Kubernetes
- Helm
- Amazon EKS
- GitHub Actions
- GHCR (GitHub Container Registry)

## Monitoring & Observability
- Prometheus
- Custom metrics
- Cron-based scheduled jobs

## Storage & Caching
- Redis / Valkey
- MinIO (S3-compatible object storage)

---

# API Endpoints

| Endpoint | Description |
|---|---|
| `/temperature` | Returns global average temperature over the last 24 hours |
| `/metrics` | Prometheus metrics endpoint |
| `/version` | Application version information |
| `/store` | Manually archives latest cached data to object storage |

---

# Example Response

## `GET /temperature`

```json
{
  "averageTemp": 18.42,
  "sensorsCount": 1243,
  "status": "Good",
  "window": "Last 24 hours",
  "timestamp": "2026-05-01T17:45:00.000Z"
}
```

---

# Project Structure

```text
.
├── charts/
│   └── hivebox/
│
├── terraform/
│
├── src/
│   ├── index.js
│   ├── server.js
│   ├── metrics.js
│   └── version.js
│
├── .github/
│   └── workflows/
│
├── Dockerfile
├── package.json
└── README.md
```

---

# Getting Started

## Prerequisites

Install the following:

- Node.js v18+
- Docker Desktop
- kubectl
- Helm
- Kubernetes cluster (kind, Minikube, or Amazon EKS)
- Git

---

# Local Development

## 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/devops-hands-on-project-hivebox.git

cd devops-hands-on-project-hivebox
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file:

```env
PORT=3000

REDIS_HOST=localhost
REDIS_PORT=6379

S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=hiveboxbucket
```

---

## 4. Run Redis locally

```bash
docker run -d -p 6379:6379 redis
```

---

## 5. Run MinIO locally

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

---

## 6. Start the application

```bash
npm start
```

Application runs on:

```text
http://localhost:3000
```

---

# Running with Docker

## Build image

```bash
docker build -t hivebox .
```

## Run container

```bash
docker run -p 3000:3000 hivebox
```

---

# Kubernetes Deployment

The application is deployed to Kubernetes using Helm.

## Deploy with Helm

```bash
helm upgrade --install hivebox ./charts/hivebox
```

## Verify deployment

```bash
kubectl get pods
kubectl get services
```

---

# Amazon EKS Deployment

Infrastructure provisioning is managed separately using Terraform.

Once the EKS cluster exists, the CI/CD pipeline connects to the cluster and deploys the application using Helm.

## Connect locally

```bash
aws eks update-kubeconfig \
  --region eu-west-2 \
  --name hivebox-london-cluster
```

## Verify cluster access

```bash
kubectl get nodes
```

---

# CI/CD Pipeline

GitHub Actions automates the application delivery workflow.

## Pipeline Stages

```text
1. Install dependencies
2. Lint application
3. Run tests
4. Build Docker image
5. Push image to GHCR
6. Connect to Amazon EKS
7. Deploy using Helm
```

The infrastructure lifecycle is managed separately from application deployments following modern DevOps best practices.

---

# Monitoring & Observability

Prometheus metrics are exposed at:

```text
/metrics
```

Metrics include:
- API request metrics
- Node.js runtime metrics
- Temperature aggregation metrics
- Cache statistics
- Health monitoring

---

# DevOps Practices Demonstrated

- Containerised application delivery
- Kubernetes orchestration
- Helm-based deployments
- GitHub Actions CI/CD
- Amazon EKS integration
- Infrastructure as Code with Terraform
- Observability with Prometheus
- Object storage integration
- Caching strategies
- Cloud-native architecture patterns

---

# Future Improvements

- Add Grafana dashboards
- Implement distributed tracing
- Add integration and E2E testing
- Introduce ArgoCD GitOps workflows
- Add horizontal pod autoscaling
- Improve resiliency and retry handling
- Add API authentication and rate limiting

---

# Author

Abdullahi Mohamed Mohamoud

Computer Science Graduate — Queen Mary University of London

---

# License

This project is licensed under the MIT License.