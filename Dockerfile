# ═══════════════════════════════════════════════════════════════════
# Dockerfile para Proyecto MLOps de Viviendas
# Backend Python para DVC + FastAPI + MLflow
# ═══════════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar requisitos de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar SOLO archivos del proyecto necesarios para pipeline DVC
COPY dvc.yaml params.yaml ./
COPY src/ ./src/
COPY api/ ./api/

# Exponer puertos para API y MLflow
EXPOSE 8000 5000 

# Comando por defecto (puede ser anulado por docker-compose)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
