#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Training Housing Price Prediction Model${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if virtual environment is activated
if [[ -z "${VIRTUAL_ENV}" ]]; then
    echo -e "${YELLOW}⚠️  Virtual environment not activated. Activating...${NC}"
    source venv/bin/activate
fi

# Check if data exists
if [ ! -f "data/boston_housing.csv" ]; then
    echo -e "${YELLOW}⚠️  Data not found. Downloading...${NC}"
    python src/download_data.py
fi

# Start MLflow server in background if not running
if ! pgrep -f "mlflow server" > /dev/null; then
    echo -e "${BLUE}🚀 Starting MLflow server...${NC}"
    mlflow server \
        --host 0.0.0.0 \
        --port 5000 \
        --backend-store-uri file:///$(pwd)/mlruns \
        --default-artifact-root file:///$(pwd)/mlartifacts &
    MLFLOW_PID=$!
    sleep 5
    echo -e "${GREEN}✅ MLflow server started (PID: $MLFLOW_PID)${NC}"
    echo -e "${BLUE}📊 MLflow UI: http://localhost:5000${NC}\n"
fi

# Run training
echo -e "${BLUE}🚀 Starting model training...${NC}\n"
python src/train.py

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Training completed successfully!${NC}"
    echo -e "${BLUE}📊 View experiments at: http://localhost:5000${NC}"
    echo -e "${BLUE}📁 Model saved to: models/production/${NC}\n"
else
    echo -e "\n${RED}❌ Training failed!${NC}\n"
    exit 1
fi
