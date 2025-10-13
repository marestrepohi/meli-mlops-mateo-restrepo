#!/bin/bash

# MLOps System Startup Script
# This script starts both backend and frontend services

set -e

echo "🚀 Starting MLOps System..."
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "params.yaml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Check if Node.js or Bun is installed
if ! command -v node &> /dev/null && ! command -v bun &> /dev/null; then
    echo "❌ Node.js or Bun is not installed"
    exit 1
fi

# Install Python dependencies if needed
echo -e "${BLUE}📦 Checking Python dependencies...${NC}"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Python dependencies ready${NC}"

# Install frontend dependencies if needed
echo -e "${BLUE}📦 Checking frontend dependencies...${NC}"
cd front
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
fi
cd ..
echo -e "${GREEN}✓ Frontend dependencies ready${NC}"

# Check if data exists, download if not
if [ ! -f "data/housing.csv" ]; then
    echo -e "${BLUE}📥 Downloading dataset...${NC}"
    python src/download_data.py
    echo -e "${GREEN}✓ Dataset downloaded${NC}"
fi

# Train model if not exists
if [ ! -f "models/model.pkl" ]; then
    echo -e "${BLUE}🤖 Training initial model...${NC}"
    python src/train.py
    echo -e "${GREEN}✓ Model trained${NC}"
fi

# Check if ports are available
if check_port 8000; then
    echo -e "${YELLOW}⚠ Port 8000 is already in use. Backend may already be running.${NC}"
else
    echo -e "${BLUE}🔧 Starting Backend API on port 8000...${NC}"
    python src/main.py > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
fi

# Wait for backend to be ready
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ Backend may not be ready yet, but continuing...${NC}"
    fi
    sleep 1
done

# Start frontend
if check_port 8080; then
    echo -e "${YELLOW}⚠ Port 8080 is already in use. Frontend may already be running.${NC}"
else
    echo -e "${BLUE}🌐 Starting Frontend on port 8080...${NC}"
    cd front
    if command -v bun &> /dev/null; then
        bun dev > ../logs/frontend.log 2>&1 &
    else
        npm run dev > ../logs/frontend.log 2>&1 &
    fi
    FRONTEND_PID=$!
    cd ..
    echo $FRONTEND_PID > .frontend.pid
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ MLOps System is running!${NC}"
echo ""
echo "🔗 Access the application:"
echo "   Frontend:  http://localhost:8080"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   MLflow:    http://localhost:5000 (if running separately)"
echo ""
echo "📊 Available Pages:"
echo "   Dashboard:     http://localhost:8080/"
echo "   EDA Explorer:  http://localhost:8080/eda"
echo "   Data Lineage:  http://localhost:8080/lineage"
echo "   MLflow Viewer: http://localhost:8080/mlflow"
echo "   Drift Monitor: http://localhost:8080/drift"
echo "   Data Generator: http://localhost:8080/generator"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"
echo "================================"
