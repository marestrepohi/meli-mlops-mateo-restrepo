# ═══════════════════════════════════════════════════════════════════
# Makefile para Proyecto MLOps de Viviendas
# Gestión de Docker Compose
# ═══════════════════════════════════════════════════════════════════

.PHONY: help build up down restart logs logs-api logs-mlflow logs-frontend shell test clean ps urls start

# Variables
DOCKER_COMPOSE = docker-compose
BACKEND_CONTAINER = mlops-housing-backend
MLFLOW_CONTAINER = mlops-housing-mlflow
FRONTEND_CONTAINER = mlops-housing-frontend

# ───────────────────────────────────────────────────────────────────
# Ayuda
# ───────────────────────────────────────────────────────────────────
help:
	@echo "════════════════════════════════════════════════════════════"
	@echo "  Proyecto MLOps de Viviendas - Comandos Docker Compose"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "🚀 Comandos Principales:"
	@echo "  make start          - 🌟 Construir + Iniciar todos los servicios (RECOMENDADO)"
	@echo "  make build          - Construir todas las imágenes Docker"
	@echo "  make up             - Iniciar todos los servicios (API, MLflow, Frontend)"
	@echo "  make down           - Detener y remover todos los contenedores"
	@echo "  make restart        - Reiniciar todos los servicios"
	@echo ""
	@echo "📋 Monitoreo:"
	@echo "  make logs           - Mostrar logs de todos los servicios"
	@echo "  make logs-api       - Mostrar solo logs de API"
	@echo "  make logs-mlflow    - Mostrar solo logs de MLflow"
	@echo "  make logs-frontend  - Mostrar solo logs de Frontend"
	@echo "  make ps             - Mostrar estado de contenedores"
	@echo ""
	@echo "🔧 Operaciones:"
	@echo "  make shell                - Abrir bash en contenedor de backend"
	@echo "  make test                 - Probar salud de todos los servicios"
	@echo "  make dvc-repro            - Ejecutar pipeline DVC"
	@echo "  make register-model       - Registrar mejor modelo en Producción"
	@echo "  make register-model-staging - Registrar mejor modelo en Staging"
	@echo "  make clean                - Remover todos los contenedores y volúmenes"
	@echo "  make urls                 - Mostrar URLs de servicios"
	@echo ""
	@echo "📡 Servicios (después de 'make up'):"
	@echo "  - FastAPI:    http://localhost:8000"
	@echo "  - MLflow UI:  http://localhost:5000"
	@echo "  - Frontend:   http://localhost:8080"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

# ───────────────────────────────────────────────────────────────────
# Construir e Iniciar
# ───────────────────────────────────────────────────────────────────
build:
	@echo "🏗️  Construyendo imágenes Docker..."
	$(DOCKER_COMPOSE) build
	@echo "✅ ¡Construcción completa!"

up:
	@echo "🚀 Iniciando todos los servicios..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ ¡Servicios iniciados!"
	@echo ""
	@make urls
	@echo ""
	@echo "💡 Ejecuta 'make logs' para ver logs"
	@echo "💡 Ejecuta 'make test' para verificar servicios"

start:
	@echo "════════════════════════════════════════════════════════════"
	@echo "  🌟 Inicio Completo del Pipeline MLOps"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Esto ejecutará el pipeline completo en orden:"
	@echo "  1. 🏗️  Construir imágenes Docker"
	@echo "  2. 🔄 Pipeline DVC: init → ingesta datos → preparación → entrenamiento"
	@echo "  3. 📊 MLflow UI: Iniciar en puerto 5000 (después de DVC)"
	@echo "  4. 🚀 FastAPI: Iniciar en puerto 8000 (después de MLflow)"
	@echo "  5. 🌐 Frontend: npm install → servidor dev en puerto 8080 (después de API)"
	@echo "  6. 🔄 Sincronizar carpetas: data, mlruns, models → frontend/public/"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@make build
	@echo ""
	@echo "🚀 Iniciando servicios en orden de cascada..."
	@$(DOCKER_COMPOSE) up -d
	@echo ""
	@echo "⏳ Estado del Pipeline:"
	@echo "   ⏳ Pipeline DVC en ejecución (esto puede tomar 5-10 minutos)..."
	@echo "   ⏳ MLflow se iniciará después de que DVC se complete"
	@echo "   ⏳ API se iniciará después de que MLflow sea saludable"
	@echo "   ⏳ Frontend se iniciará después de que API sea saludable"
	@echo ""
	@echo "📋 Monitorear progreso:"
	@echo "  make logs-dvc       - Ver ejecución del pipeline DVC"
	@echo "  make logs-mlflow    - Ver logs de MLflow UI"
	@echo "  make logs-api       - Ver logs de FastAPI"
	@echo "  make logs-frontend  - Ver logs de Frontend"
	@echo "  make logs           - Ver todos los logs"
	@echo "  make ps             - Verificar estado de servicios"
	@echo ""
	@echo "🧪 Para verificar que todos los servicios son saludables:"
	@echo "  make test"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

down:
	@echo "🛑 Deteniendo todos los servicios..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Servicios detenidos"

restart:
	@echo "🔄 Reiniciando todos los servicios..."
	$(DOCKER_COMPOSE) restart
	@echo "✅ Servicios reiniciados"

# ───────────────────────────────────────────────────────────────────
# Logs
# ───────────────────────────────────────────────────────────────────
logs:
	@echo "📋 Mostrando logs de todos los servicios (Ctrl+C para salir)..."
	$(DOCKER_COMPOSE) logs -f

logs-dvc:
	@echo "📋 Logs del pipeline DVC (Ctrl+C para salir)..."
	$(DOCKER_COMPOSE) logs -f dvc-pipeline

logs-mlflow:
	@echo "📋 Logs de MLflow UI (Ctrl+C para salir)..."
	$(DOCKER_COMPOSE) logs -f mlflow

logs-api:
	@echo "📋 Logs de FastAPI (Ctrl+C para salir)..."
	$(DOCKER_COMPOSE) logs -f api

logs-frontend:
	@echo "📋 Logs de Frontend (Ctrl+C para salir)..."
	$(DOCKER_COMPOSE) logs -f frontend

# ───────────────────────────────────────────────────────────────────
# Operaciones
# ───────────────────────────────────────────────────────────────────
shell:
	@echo "🐚 Abriendo bash en contenedor de API..."
	docker exec -it mlops-housing-api /bin/bash

shell-dvc:
	@echo "🐚 Abriendo bash en contenedor del pipeline DVC..."
	docker exec -it mlops-housing-dvc-pipeline /bin/bash

dvc-repro:
	@echo "🔄 Re-ejecutando pipeline DVC..."
	@echo "⚠️  Nota: El pipeline se ejecuta automáticamente al iniciar"
	@echo "⚠️  Este comando requiere que el contenedor dvc-pipeline esté en ejecución"
	docker exec -it mlops-housing-dvc-pipeline dvc repro
	@echo "✅ Pipeline DVC completado"

register-model:
	@echo "📦 Registrando modelo en MLflow Model Registry..."
	python src/model_register.py --stage Production
	@echo "✅ Modelo registrado exitosamente"

register-model-staging:
	@echo "📦 Registrando modelo en MLflow Model Registry (Staging)..."
	python src/model_register.py --stage Staging
	@echo "✅ Modelo registrado en Staging"

test:
	@echo "🧪 Probando servicios..."
	@echo ""
	@sleep 2
	@echo "Probando FastAPI..."
	@curl -s http://localhost:8000/health > /dev/null 2>&1 && echo "  ✅ FastAPI está en ejecución" || echo "  ❌ FastAPI no está respondiendo"
	@echo ""
	@echo "Probando MLflow..."
	@curl -s http://localhost:5000 > /dev/null 2>&1 && echo "  ✅ MLflow está en ejecución" || echo "  ❌ MLflow no está respondiendo"
	@echo ""
	@echo "Probando Frontend..."
	@curl -s http://localhost:8080 > /dev/null 2>&1 && echo "  ✅ Frontend está en ejecución" || echo "  ❌ Frontend no está respondiendo"
	@echo ""

ps:
	@echo "📊 Estado de contenedores:"
	@$(DOCKER_COMPOSE) ps

clean:
	@echo "🧹 Limpiando (contenedores, redes, volúmenes)..."
	$(DOCKER_COMPOSE) down -v
	@echo "✅ Limpieza completada"

# ───────────────────────────────────────────────────────────────────
# Información
# ───────────────────────────────────────────────────────────────────
urls:
	@echo "════════════════════════════════════════════════════════════"
	@echo "  📡 URLs de Servicios"
	@echo "════════════════════════════════════════════════════════════"
	@echo ""
	@echo "  FastAPI Swagger:  http://localhost:8000/docs"
	@echo "  FastAPI Health:   http://localhost:8000/health"
	@echo "  MLflow UI:        http://localhost:5000"
	@echo "  Frontend:         http://localhost:8080"
	@echo ""
	@echo "════════════════════════════════════════════════════════════"

# ───────────────────────────────────────────────────────────────────
# Accesos rápidos
# ───────────────────────────────────────────────────────────────────
run: up
stop: down
rebuild: clean build up
