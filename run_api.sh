#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Housing Price Prediction API${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if virtual environment is activated
if [[ -z "${VIRTUAL_ENV}" ]]; then
    echo -e "${YELLOW}⚠️  Virtual environment not activated. Activating...${NC}"
    source venv/bin/activate
fi

# Check if model exists
if [ ! -f "models/production/model.joblib" ]; then
    echo -e "${YELLOW}⚠️  Model not found. Please train the model first:${NC}"
    echo -e "${BLUE}   ./train.sh${NC}\n"
    exit 1
fi

echo -e "${GREEN}✅ Model found${NC}"
echo -e "${BLUE}🚀 Starting API server...${NC}\n"

# Start API
uvicorn src.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload

echo -e "\n${BLUE}📚 API Documentation: http://localhost:8000/docs${NC}"
echo -e "${BLUE}🏥 Health Check: http://localhost:8000/health${NC}"
echo -e "${BLUE}📊 Metrics: http://localhost:8000/metrics${NC}\n"
