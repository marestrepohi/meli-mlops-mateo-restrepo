#!/bin/bash

# MLOps System Shutdown Script
# This script stops both backend and frontend services

set -e

echo "🛑 Stopping MLOps System..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID
        echo -e "${GREEN}✓ Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend process not found${NC}"
    fi
    rm .backend.pid
else
    echo -e "${YELLOW}No backend PID file found${NC}"
fi

# Stop frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${YELLOW}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend process not found${NC}"
    fi
    rm .frontend.pid
else
    echo -e "${YELLOW}No frontend PID file found${NC}"
fi

# Kill any remaining processes on ports 8000 and 8080
echo -e "${YELLOW}Checking for any remaining processes...${NC}"

if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Killing process on port 8000..."
    kill -9 $(lsof -t -i:8000) 2>/dev/null || true
fi

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Killing process on port 8080..."
    kill -9 $(lsof -t -i:8080) 2>/dev/null || true
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ All services stopped${NC}"
echo "================================"
