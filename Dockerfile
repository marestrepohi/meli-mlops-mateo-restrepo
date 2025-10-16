# ═══════════════════════════════════════════════════════════════════
# Dockerfile for MLOps Housing Project
# Python Backend for DVC + FastAPI + MLflow
# ═══════════════════════════════════════════════════════════════════

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ONLY necessary project files for DVC pipeline
COPY dvc.yaml params.yaml ./
COPY src/ ./src/
COPY api/ ./api/

# Create directories for DVC outputs (will be populated by DVC repro)
# data/raw - created and populated by data_ingestion.py
# data/processed - created by data_preparation.py
# models - created by model_train.py
# mlruns - created by MLflow during training
RUN mkdir -p data models mlruns

# Expose ports for API and MLflow
EXPOSE 8000 5000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (can be overridden by docker-compose)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
