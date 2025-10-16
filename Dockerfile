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

# Expose ports for API and MLflow
EXPOSE 8000 5000 

# Default command (can be overridden by docker-compose)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
