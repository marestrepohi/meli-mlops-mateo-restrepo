#!/bin/bash

# System Health Check Script
# Verifies all components are properly configured

echo "🔍 MLOps System Health Check"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

# Function to check
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

echo ""
echo "📦 Checking Dependencies..."
echo "----------------------------"

# Python
command -v python3 >/dev/null 2>&1
check "Python 3 installed"

# Node or Bun
(command -v node >/dev/null 2>&1 || command -v bun >/dev/null 2>&1)
check "Node.js or Bun installed"

# Git
command -v git >/dev/null 2>&1
check "Git installed"

echo ""
echo "📁 Checking Project Structure..."
echo "----------------------------"

# Check key files
test -f "params.yaml"
check "params.yaml exists"

test -f "requirements.txt"
check "requirements.txt exists"

test -f "src/main.py"
check "src/main.py exists"

test -f "src/train.py"
check "src/train.py exists"

test -f "src/analytics.py"
check "src/analytics.py exists"

test -f "front/package.json"
check "front/package.json exists"

test -f "front/src/App.tsx"
check "front/src/App.tsx exists"

test -f "front/src/lib/api.ts"
check "front/src/lib/api.ts exists"

echo ""
echo "🔧 Checking Frontend Pages..."
echo "----------------------------"

test -f "front/src/pages/EDAExplorer.tsx"
check "EDA Explorer page"

test -f "front/src/pages/DataLineage.tsx"
check "Data Lineage page"

test -f "front/src/pages/MLflowViewer.tsx"
check "MLflow Viewer page"

test -f "front/src/pages/DriftMonitor.tsx"
check "Drift Monitor page"

test -f "front/src/pages/DataGenerator.tsx"
check "Data Generator page"

echo ""
echo "📝 Checking Documentation..."
echo "----------------------------"

test -f "README.md"
check "README.md"

test -f "FRONTEND_GUIDE.md"
check "FRONTEND_GUIDE.md"

test -f "FRONTEND_INTEGRATION_SUMMARY.md"
check "FRONTEND_INTEGRATION_SUMMARY.md"

test -f "PARAMS_GUIDE.md"
check "PARAMS_GUIDE.md"

echo ""
echo "🐍 Checking Python Environment..."
echo "----------------------------"

if [ -d "venv" ]; then
    echo -e "${GREEN}✓${NC} Virtual environment exists"
    ((PASSED++))
    
    source venv/bin/activate 2>/dev/null
    
    python3 -c "import fastapi" 2>/dev/null
    check "FastAPI installed"
    
    python3 -c "import sklearn" 2>/dev/null
    check "scikit-learn installed"
    
    python3 -c "import mlflow" 2>/dev/null
    check "MLflow installed"
    
    python3 -c "import scipy" 2>/dev/null
    check "scipy installed"
    
    python3 -c "import pandas" 2>/dev/null
    check "pandas installed"
else
    echo -e "${YELLOW}⚠${NC} Virtual environment not created (run: python3 -m venv venv)"
    ((FAILED++))
fi

echo ""
echo "📦 Checking Frontend Dependencies..."
echo "----------------------------"

if [ -d "front/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
    ((PASSED++))
    
    test -d "front/node_modules/react"
    check "React installed"
    
    test -d "front/node_modules/axios"
    check "Axios installed"
    
    test -d "front/node_modules/recharts"
    check "Recharts installed"
    
    test -d "front/node_modules/react-router-dom"
    check "React Router installed"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found (run: cd front && npm install)"
    ((FAILED++))
fi

echo ""
echo "📊 Checking Data & Models..."
echo "----------------------------"

test -d "data"
check "data/ directory exists"

test -f "data/housing.csv"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} housing.csv exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} housing.csv not found (run: python src/download_data.py)"
    ((FAILED++))
fi

test -d "models"
check "models/ directory exists"

test -f "models/model.pkl"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} model.pkl exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} model.pkl not found (run: python src/train.py)"
    ((FAILED++))
fi

echo ""
echo "🚀 Checking Scripts..."
echo "----------------------------"

test -x "start.sh"
check "start.sh is executable"

test -x "stop.sh"
check "stop.sh is executable"

test -f "train.sh"
check "train.sh exists"

echo ""
echo "⚙️  Checking Configuration..."
echo "----------------------------"

test -f "front/.env"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} front/.env exists"
    ((PASSED++))
    
    if grep -q "VITE_API_URL" front/.env; then
        echo -e "${GREEN}✓${NC} VITE_API_URL configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} VITE_API_URL not configured"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} front/.env not found (create with: echo 'VITE_API_URL=http://localhost:8000' > front/.env)"
    ((FAILED++))
fi

echo ""
echo "================================"
echo "📊 Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! System is ready.${NC}"
    echo ""
    echo "🚀 To start the system, run:"
    echo "   ./start.sh"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Please review above.${NC}"
    echo ""
    echo "📝 Quick fixes:"
    echo "   1. Install Python deps: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    echo "   2. Install frontend deps: cd front && npm install"
    echo "   3. Download data: python src/download_data.py"
    echo "   4. Train model: python src/train.py"
    echo "   5. Configure frontend: echo 'VITE_API_URL=http://localhost:8000' > front/.env"
    exit 1
fi
