# ═══════════════════════════════════════════════════════════════════
# Makefile for MLOps Housing Project
# Docker Compose Management
# ═══════════════════════════════════════════════════════════════════

.PHONY: help build up down restart logs logs-api logs-mlflow logs-frontend shell test clean ps urls start

# Variables
DOCKER_COMPOSE = docker-compose
BACKEND_CONTAINER = mlops-housing-backend
MLFLOW_CONTAINER = mlops-housing-mlflow
FRONTEND_CONTAINER = mlops-housing-frontend

# ───────────────────────────────────────────────────────────────────
# Help
# ───────────────────────────────────────────────────────────────────
help:
	@echo "════════════════════════════════════════════════════════════"
	@echo "  MLOps Housing Project - Docker Compose Commands"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "🚀 Main Commands:"
	@echo "  make start          - 🌟 Build + Start all services (RECOMMENDED)"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services (API, MLflow, Frontend)"
	@echo "  make down           - Stop and remove all containers"
	@echo "  make restart        - Restart all services"
	@echo ""
	@echo "📋 Monitoring:"
	@echo "  make logs           - Show all service logs"
	@echo "  make logs-api       - Show only API logs"
	@echo "  make logs-mlflow    - Show only MLflow logs"
	@echo "  make logs-frontend  - Show only Frontend logs"
	@echo "  make ps             - Show container status"
	@echo ""
	@echo "🔧 Operations:"
	@echo "  make shell                - Open bash in backend container"
	@echo "  make test                 - Test all services health"
	@echo "  make dvc-repro            - Run DVC pipeline"
	@echo "  make register-model       - Register best model to Production"
	@echo "  make register-model-staging - Register best model to Staging"
	@echo "  make clean                - Remove all containers and volumes"
	@echo "  make urls                 - Show service URLs"
	@echo ""
	@echo "📡 Services (after 'make up'):"
	@echo "  - FastAPI:    http://localhost:8000"
	@echo "  - MLflow UI:  http://localhost:5000"
	@echo "  - Frontend:   http://localhost:8080"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

# ───────────────────────────────────────────────────────────────────
# Build & Run
# ───────────────────────────────────────────────────────────────────
build:
	@echo "🏗️  Building Docker images..."
	$(DOCKER_COMPOSE) build
	@echo "✅ Build complete!"

up:
	@echo "🚀 Starting all services..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Services started!"
	@echo ""
	@make urls
	@echo ""
	@echo "💡 Run 'make logs' to see logs"
	@echo "💡 Run 'make test' to verify services"

start:
	@echo "════════════════════════════════════════════════════════════"
	@echo "  🌟 Complete MLOps Pipeline Startup"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "This will execute the complete pipeline in order:"
	@echo "  1. 🏗️  Build Docker images"
	@echo "  2. 🔄 DVC Pipeline: init → data ingestion → preparation → training"
	@echo "  3. 📊 MLflow UI: Start on port 5000 (after DVC completes)"
	@echo "  4. 🚀 FastAPI: Start on port 8000 (after MLflow)"
	@echo "  5. 🌐 Frontend: npm install → dev server on port 8080 (after API)"
	@echo "  6. 🔄 Sync folders: data, mlruns, models → frontend/public/"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@make build
	@echo ""
	@echo "🚀 Starting services in cascade order..."
	@$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "⏳ Pipeline Status:"
	@echo "   ⏳ DVC Pipeline running (this may take 5-10 minutes)..."
	@echo "   ⏳ MLflow will start after DVC completes"
	@echo "   ⏳ API will start after MLflow is healthy"
	@echo "   ⏳ Frontend will start after API is healthy"
	@echo ""
	@echo "📋 Monitor progress:"
	@echo "  make logs-dvc       - See DVC pipeline execution"
	@echo "  make logs-mlflow    - See MLflow UI logs"
	@echo "  make logs-api       - See FastAPI logs"
	@echo "  make logs-frontend  - See Frontend logs"
	@echo "  make logs           - See all logs"
	@echo "  make ps             - Check services status"
	@echo ""
	@echo "🧪 To verify all services are healthy:"
	@echo "  make test"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

down:
	@echo "🛑 Stopping all services..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Services stopped"

restart:
	@echo "🔄 Restarting all services..."
	$(DOCKER_COMPOSE) restart
	@echo "✅ Services restarted"

# ───────────────────────────────────────────────────────────────────
# Logs
# ───────────────────────────────────────────────────────────────────
logs:
	@echo "📋 Showing all service logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f

logs-dvc:
	@echo "📋 DVC Pipeline logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f dvc-pipeline

logs-mlflow:
	@echo "📋 MLflow UI logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f mlflow

logs-api:
	@echo "📋 FastAPI logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f api

logs-frontend:
	@echo "📋 Frontend logs (Ctrl+C to exit)..."
	$(DOCKER_COMPOSE) logs -f frontend

# ───────────────────────────────────────────────────────────────────
# Operations
# ───────────────────────────────────────────────────────────────────
shell:
	@echo "🐚 Opening bash in API container..."
	docker exec -it mlops-housing-api /bin/bash

shell-dvc:
	@echo "🐚 Opening bash in DVC pipeline container..."
	docker exec -it mlops-housing-dvc-pipeline /bin/bash

dvc-repro:
	@echo "🔄 Re-running DVC pipeline..."
	@echo "⚠️  Note: The pipeline runs automatically on startup"
	@echo "⚠️  This command requires dvc-pipeline container to be running"
	docker exec -it mlops-housing-dvc-pipeline dvc repro
	@echo "✅ DVC pipeline completed"

register-model:
	@echo "📦 Registering model in MLflow Model Registry..."
	python src/model_register.py --stage Production
	@echo "✅ Model registered successfully"

register-model-staging:
	@echo "📦 Registering model in MLflow Model Registry (Staging)..."
	python src/model_register.py --stage Staging
	@echo "✅ Model registered in Staging"

test:
	@echo "🧪 Testing services..."
	@echo ""
	@sleep 2
	@echo "Testing FastAPI..."
	@curl -s http://localhost:8000/health > /dev/null 2>&1 && echo "  ✅ FastAPI is running" || echo "  ❌ FastAPI is not responding"
	@echo ""
	@echo "Testing MLflow..."
	@curl -s http://localhost:5000 > /dev/null 2>&1 && echo "  ✅ MLflow is running" || echo "  ❌ MLflow is not responding"
	@echo ""
	@echo "Testing Frontend..."
	@curl -s http://localhost:8080 > /dev/null 2>&1 && echo "  ✅ Frontend is running" || echo "  ❌ Frontend is not responding"
	@echo ""

ps:
	@echo "📊 Container status:"
	@$(DOCKER_COMPOSE) ps

clean:
	@echo "🧹 Cleaning up (containers, networks, volumes)..."
	$(DOCKER_COMPOSE) down -v
	@echo "✅ Cleanup complete"

# ───────────────────────────────────────────────────────────────────
# Info
# ───────────────────────────────────────────────────────────────────
urls:
	@echo "════════════════════════════════════════════════════════════"
	@echo "  📡 Service URLs"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "  FastAPI Swagger:  http://localhost:8000/docs"
	@echo "  FastAPI Health:   http://localhost:8000/health"
	@echo "  MLflow UI:        http://localhost:5000"
	@echo "  Frontend:         http://localhost:8080"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

# ───────────────────────────────────────────────────────────────────
# Shortcuts
# ───────────────────────────────────────────────────────────────────
run: up
stop: down
rebuild: clean build up
