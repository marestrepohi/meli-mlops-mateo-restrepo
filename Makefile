.PHONY: help install setup clean test lint train api docker-build docker-up docker-down logs

# Variables
PYTHON := python3
PIP := pip
VENV := venv
API_PORT := 8000
MLFLOW_PORT := 5000

# Colores para output
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help: ## Muestra esta ayuda
	@echo "$(GREEN)Housing Price Prediction - Comandos Disponibles$(NC)"
	@echo "=================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Instala dependencias en ambiente virtual
	@echo "$(GREEN)📦 Instalando dependencias...$(NC)"
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && $(PIP) install --upgrade pip
	. $(VENV)/bin/activate && $(PIP) install -r requirements.txt
	. $(VENV)/bin/activate && $(PIP) install -e .
	@echo "$(GREEN)✅ Dependencias instaladas$(NC)"

setup: install ## Setup completo del proyecto
	@echo "$(GREEN)🔧 Configurando proyecto...$(NC)"
	@bash setup.sh

clean: ## Limpia archivos temporales y cache
	@echo "$(GREEN)🧹 Limpiando archivos temporales...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.coverage" -delete
	rm -rf htmlcov/ .coverage coverage.xml
	@echo "$(GREEN)✅ Limpieza completada$(NC)"

test: ## Ejecuta tests
	@echo "$(GREEN)🧪 Ejecutando tests...$(NC)"
	. $(VENV)/bin/activate && pytest tests/ -v --cov=src --cov=api --cov-report=term --cov-report=html

lint: ## Ejecuta linters (flake8, black)
	@echo "$(GREEN)🔍 Ejecutando linters...$(NC)"
	. $(VENV)/bin/activate && flake8 src/ api/ tests/ --max-line-length=100 --ignore=E203,W503 || true
	. $(VENV)/bin/activate && black --check src/ api/ tests/ || true

format: ## Formatea código con black
	@echo "$(GREEN)✨ Formateando código...$(NC)"
	. $(VENV)/bin/activate && black src/ api/ tests/
	@echo "$(GREEN)✅ Código formateado$(NC)"

train: ## Ejecuta pipeline de entrenamiento (DVC)
	@echo "$(GREEN)🚀 Ejecutando pipeline de entrenamiento...$(NC)"
	. $(VENV)/bin/activate && dvc repro
	@echo "$(GREEN)✅ Entrenamiento completado$(NC)"

train-force: ## Ejecuta pipeline forzando todos los stages
	@echo "$(GREEN)🚀 Ejecutando pipeline (forzando todos los stages)...$(NC)"
	. $(VENV)/bin/activate && dvc repro --force
	@echo "$(GREEN)✅ Entrenamiento completado$(NC)"

api: ## Inicia la API localmente
	@echo "$(GREEN)🚀 Iniciando API en http://localhost:$(API_PORT)$(NC)"
	. $(VENV)/bin/activate && uvicorn api.main:app --host 0.0.0.0 --port $(API_PORT) --reload

api-prod: ## Inicia la API en modo producción
	@echo "$(GREEN)🚀 Iniciando API (producción) en http://localhost:$(API_PORT)$(NC)"
	. $(VENV)/bin/activate && uvicorn api.main:app --host 0.0.0.0 --port $(API_PORT) --workers 4

mlflow: ## Inicia MLflow UI
	@echo "$(GREEN)📊 Iniciando MLflow UI en http://localhost:$(MLFLOW_PORT)$(NC)"
	. $(VENV)/bin/activate && mlflow ui --host 0.0.0.0 --port $(MLFLOW_PORT)

docker-build: ## Build imagen Docker
	@echo "$(GREEN)🐳 Building Docker image...$(NC)"
	docker build -t housing-price-api:latest .
	@echo "$(GREEN)✅ Docker image built$(NC)"

docker-up: ## Inicia servicios con Docker Compose
	@echo "$(GREEN)🐳 Iniciando servicios Docker...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Servicios iniciados$(NC)"
	@echo "$(YELLOW)API: http://localhost:8000$(NC)"
	@echo "$(YELLOW)MLflow: http://localhost:5000$(NC)"

docker-down: ## Detiene servicios Docker
	@echo "$(GREEN)🛑 Deteniendo servicios Docker...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Servicios detenidos$(NC)"

docker-logs: ## Muestra logs de Docker Compose
	docker-compose logs -f

docker-restart: docker-down docker-up ## Reinicia servicios Docker

validate-api: ## Valida que la API esté funcionando
	@echo "$(GREEN)🔍 Validando API...$(NC)"
	@curl -s http://localhost:$(API_PORT)/health | jq . || echo "$(YELLOW)⚠️ API no disponible$(NC)"

smoke-test: ## Ejecuta smoke tests en la API
	@echo "$(GREEN)🧪 Ejecutando smoke tests...$(NC)"
	@echo "1. Health check..."
	@curl -f http://localhost:$(API_PORT)/health || exit 1
	@echo "\n2. Model info..."
	@curl -f http://localhost:$(API_PORT)/model/info || exit 1
	@echo "\n3. Prediction..."
	@curl -X POST http://localhost:$(API_PORT)/predict \
		-H "Content-Type: application/json" \
		-d '{"CRIM":0.00632,"NOX":0.538,"RM":6.575,"AGE":65.2,"DIS":4.09,"RAD":1.0,"TAX":296.0,"PTRATIO":15.3,"B":396.9,"LSTAT":4.98}' || exit 1
	@echo "\n$(GREEN)✅ Smoke tests passed$(NC)"

dvc-status: ## Muestra estado de DVC
	@echo "$(GREEN)📊 Estado de DVC:$(NC)"
	. $(VENV)/bin/activate && dvc status

dvc-dag: ## Muestra DAG de DVC
	@echo "$(GREEN)📊 DAG de DVC:$(NC)"
	. $(VENV)/bin/activate && dvc dag

git-push: clean ## Limpia y hace push a Git
	@echo "$(GREEN)🚀 Preparando push a Git...$(NC)"
	git add .
	git status
	@echo "$(YELLOW)⚠️ Revisa los cambios antes de commitear$(NC)"

stats: ## Muestra estadísticas del proyecto
	@echo "$(GREEN)📊 Estadísticas del Proyecto$(NC)"
	@echo "================================"
	@echo "Líneas de código Python:"
	@find src/ api/ -name "*.py" -type f | xargs wc -l | tail -1
	@echo "\nArchivos Python:"
	@find src/ api/ -name "*.py" -type f | wc -l
	@echo "\nTests:"
	@find tests/ -name "test_*.py" -type f | wc -l 2>/dev/null || echo "0"
	@echo "\nModelos entrenados:"
	@ls -1 mlruns/*/*/artifacts/model 2>/dev/null | wc -l || echo "0"

tree: ## Muestra estructura del proyecto
	@echo "$(GREEN)📁 Estructura del Proyecto$(NC)"
	@tree -L 3 -I '__pycache__|*.pyc|venv|.git|mlruns' || ls -R

# Atajos rápidos
all: clean install train api ## Setup completo + entrenamiento + API
dev: install api ## Setup + API en modo desarrollo
prod: train api-prod ## Entrenamiento + API en producción
