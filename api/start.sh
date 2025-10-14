#!/bin/bash

# Start Housing Price Prediction API
# Este script inicia la API FastAPI que carga el modelo de producción desde MLflow

echo "========================================="
echo "🚀 Starting Housing Price Prediction API"
echo "========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if virtual environment exists
if [ ! -d "../venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Please run: python -m venv venv${NC}"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source ../venv/bin/activate

# Check if MLflow tracking directory exists
if [ ! -d "../mlruns" ]; then
    echo -e "${YELLOW}⚠️  MLflow tracking directory not found.${NC}"
    echo "   Please run training first: python src/model_train.py"
    echo "   Then register model: python src/model_register.py"
    exit 1
fi

# Check if production model is registered
if [ ! -f "../models/registered_model_info.json" ]; then
    echo -e "${YELLOW}⚠️  No production model registered.${NC}"
    echo "   Please run: python src/model_register.py --stage Production"
fi

# Start API
echo ""
echo -e "${GREEN}✅ Starting API server...${NC}"
echo "   Host: 0.0.0.0"
echo "   Port: 8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

# Run uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
