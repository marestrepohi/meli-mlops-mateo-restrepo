# Makefile para Housing Price Prediction MLOps Project

.PHONY: help install setup data train serve frontend stop clean test docker-build docker-run docker-stop \
        dvc-repro dvc-status dvc-metrics dvc-plots dvc-dag dvc-push dvc-pull dvc-clean

# Variables
PYTHON := python3
PIP := pip
VENV := venv
SRC := src
TESTS := tests

# Colors para output
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m # No Color

help: ## Mostrar este mensaje de ayuda
	@echo "$(BLUE)Housing Price Prediction - MLOps Project$(NC)"
	@echo ""
	@echo "$(GREEN)Comandos disponibles:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

setup: ## Setup inicial del proyecto (crear venv e instalar dependencias)
	@echo "$(BLUE)🔧 Setting up project...$(NC)"
	@./setup.sh

install: ## Instalar dependencias
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	$(PIP) install -r requirements.txt
	$(PIP) install -e .

download-data: ## Descargar dataset de Boston Housing
	@echo "$(BLUE)📥 Downloading data...$(NC)"
	$(PYTHON) $(SRC)/download_data.py

train: ## Entrenar modelo
	@echo "$(BLUE)🚀 Training model...$(NC)"
	@./train.sh

test: ## Ejecutar tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	pytest $(TESTS)/ -v --cov=$(SRC) --cov-report=term --cov-report=html

test-verbose: ## Ejecutar tests con output detallado
	pytest $(TESTS)/ -vv --cov=$(SRC) --cov-report=term-missing

lint: ## Ejecutar linters (flake8, mypy)
	@echo "$(BLUE)🔍 Running linters...$(NC)"
	flake8 $(SRC)/ $(TESTS)/ --max-line-length=100 --ignore=E203,W503
	mypy $(SRC)/ --ignore-missing-imports

format: ## Formatear código con black
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	black $(SRC)/ $(TESTS)/

format-check: ## Verificar formato sin modificar
	black --check $(SRC)/ $(TESTS)/

run-api: ## Iniciar API de FastAPI
	@echo "$(BLUE)🚀 Starting API...$(NC)"
	@./run_api.sh

run-api-dev: ## Iniciar API en modo desarrollo
	uvicorn $(SRC).main:app --reload --host 0.0.0.0 --port 8000

run-mlflow: ## Iniciar MLflow tracking server
	@echo "$(BLUE)📊 Starting MLflow server...$(NC)"
	mlflow server --host 0.0.0.0 --port 5000 \
		--backend-store-uri file:///$(PWD)/mlruns \
		--default-artifact-root file:///$(PWD)/mlartifacts

docker-build: ## Construir imagen Docker
	@echo "$(BLUE)🐳 Building Docker image...$(NC)"
	docker-compose build

docker-up: ## Levantar servicios con Docker Compose
	@echo "$(BLUE)🐳 Starting services...$(NC)"
	docker-compose up

docker-up-build: ## Construir y levantar servicios
	@echo "$(BLUE)🐳 Building and starting services...$(NC)"
	docker-compose up --build

docker-up-detached: ## Levantar servicios en background
	@echo "$(BLUE)🐳 Starting services in background...$(NC)"
	docker-compose up -d

docker-down: ## Detener servicios Docker
	@echo "$(BLUE)🐳 Stopping services...$(NC)"
	docker-compose down

docker-logs: ## Ver logs de servicios Docker
	docker-compose logs -f

docker-logs-api: ## Ver logs solo de API
	docker-compose logs -f api

clean: ## Limpiar archivos temporales
	@echo "$(BLUE)🧹 Cleaning...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/ .coverage
	@echo "$(GREEN)✅ Cleaned!$(NC)"

clean-all: clean ## Limpiar todo incluyendo modelos y datos
	@echo "$(BLUE)🧹 Deep cleaning...$(NC)"
	rm -rf $(VENV)/
	rm -rf models/
	rm -rf mlruns/
	rm -rf mlartifacts/
	rm -rf logs/
	@echo "$(GREEN)✅ Deep cleaned!$(NC)"

pipeline: download-data train ## Ejecutar pipeline completo (download + train)
	@echo "$(GREEN)✅ Pipeline completed!$(NC)"

ci: lint test ## Ejecutar CI pipeline (lint + test)
	@echo "$(GREEN)✅ CI checks passed!$(NC)"

# Comandos de ejemplo para testing
test-api-health: ## Test health endpoint
	@echo "$(BLUE)Testing health endpoint...$(NC)"
	curl -s http://localhost:8000/health | jq

test-api-predict: ## Test prediction endpoint
	@echo "$(BLUE)Testing prediction endpoint...$(NC)"
	curl -s -X POST "http://localhost:8000/predict" \
		-H "Content-Type: application/json" \
		-d '{"CRIM":0.00632,"ZN":18.0,"INDUS":2.31,"CHAS":0.0,"NOX":0.538,"RM":6.575,"AGE":65.2,"DIS":4.0900,"RAD":1.0,"TAX":296.0,"PTRATIO":15.3,"B":396.90,"LSTAT":4.98}' | jq

test-api-metrics: ## Test metrics endpoint
	@echo "$(BLUE)Testing metrics endpoint...$(NC)"
	curl -s http://localhost:8000/metrics | jq

# Documentación
docs-open: ## Abrir documentación de la API
	@echo "$(BLUE)Opening API docs...$(NC)"
	@python -m webbrowser http://localhost:8000/docs 2>/dev/null || echo "Open http://localhost:8000/docs in your browser"

mlflow-open: ## Abrir UI de MLflow
	@echo "$(BLUE)Opening MLflow UI...$(NC)"
	@python -m webbrowser http://localhost:5000 2>/dev/null || echo "Open http://localhost:5000 in your browser"

# ============================================
# DVC Commands
# ============================================

dvc-init: ## Inicializar DVC
	@echo "$(BLUE)🔧 Initializing DVC...$(NC)"
	dvc init
	@echo "$(GREEN)✅ DVC initialized!$(NC)"

dvc-repro: ## Ejecutar pipeline DVC completo
	@echo "$(BLUE)🚀 Running DVC pipeline...$(NC)"
	@./run_dvc_pipeline.sh

dvc-repro-force: ## Forzar re-ejecución del pipeline
	@echo "$(BLUE)🚀 Force running DVC pipeline...$(NC)"
	dvc repro -f

dvc-status: ## Ver status del pipeline DVC
	@echo "$(BLUE)📊 DVC Status:$(NC)"
	dvc status

dvc-metrics: ## Mostrar métricas de DVC
	@echo "$(BLUE)📈 DVC Metrics:$(NC)"
	dvc metrics show

dvc-metrics-diff: ## Comparar métricas con versión anterior
	@echo "$(BLUE)📊 DVC Metrics Diff:$(NC)"
	dvc metrics diff

dvc-plots: ## Generar plots de DVC
	@echo "$(BLUE)📊 Generating DVC plots...$(NC)"
	dvc plots show

dvc-plots-diff: ## Comparar plots con versión anterior
	@echo "$(BLUE)📊 DVC Plots Diff:$(NC)"
	dvc plots diff

dvc-dag: ## Mostrar DAG del pipeline
	@echo "$(BLUE)📊 DVC Pipeline DAG:$(NC)"
	dvc dag

dvc-dag-ascii: ## Mostrar DAG en ASCII art
	@echo "$(BLUE)📊 DVC Pipeline DAG (ASCII):$(NC)"
	dvc dag --ascii

dvc-push: ## Push datos y modelos a remote
	@echo "$(BLUE)📤 Pushing to DVC remote...$(NC)"
	dvc push

dvc-pull: ## Pull datos y modelos desde remote
	@echo "$(BLUE)📥 Pulling from DVC remote...$(NC)"
	dvc pull

dvc-fetch: ## Fetch datos sin checkout
	@echo "$(BLUE)📥 Fetching from DVC remote...$(NC)"
	dvc fetch

dvc-checkout: ## Checkout datos trackeados
	@echo "$(BLUE)🔄 Checking out DVC files...$(NC)"
	dvc checkout

dvc-clean: ## Limpiar caché de DVC
	@echo "$(BLUE)🧹 Cleaning DVC cache...$(NC)"
	dvc gc -w

dvc-clean-all: ## Limpiar todo el caché de DVC
	@echo "$(BLUE)🧹 Cleaning all DVC cache...$(NC)"
	dvc gc -wa

dvc-diff: ## Ver diferencias en datos
	@echo "$(BLUE)📊 DVC Diff:$(NC)"
	dvc diff

dvc-exp-show: ## Mostrar experimentos
	@echo "$(BLUE)🧪 DVC Experiments:$(NC)"
	dvc exp show

dvc-cheatsheet: ## Mostrar cheatsheet de comandos DVC
	@./dvc_cheatsheet.sh

# Workflows combinados DVC
dvc-full-pipeline: dvc-pull dvc-repro dvc-metrics dvc-push ## Pipeline completo: pull → run → push
	@echo "$(GREEN)✅ Full DVC pipeline completed!$(NC)"

dvc-experiment: ## Ejecutar experimento completo
	@echo "$(BLUE)🧪 Running DVC experiment...$(NC)"
	dvc exp run
	dvc metrics show
	dvc plots show

dvc-compare: dvc-metrics-diff dvc-plots-diff ## Comparar con versión anterior
	@echo "$(GREEN)✅ Comparison completed!$(NC)"
