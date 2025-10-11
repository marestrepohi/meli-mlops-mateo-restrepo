#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Housing Price Prediction - Setup Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.9 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python found:${NC} $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "\n${BLUE}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "\n${GREEN}✅ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "\n${BLUE}🔄 Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "\n${BLUE}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "\n${BLUE}📥 Installing dependencies...${NC}"
pip install -r requirements.txt

# Install package in editable mode
echo -e "\n${BLUE}📦 Installing package...${NC}"
pip install -e .

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "\n${BLUE}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "\n${GREEN}✅ .env file already exists${NC}"
fi

# Create necessary directories
echo -e "\n${BLUE}📁 Creating directories...${NC}"
mkdir -p data/raw
mkdir -p models/production
mkdir -p logs
mkdir -p mlruns
mkdir -p mlartifacts
echo -e "${GREEN}✅ Directories created${NC}"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Download data: ${GREEN}python src/download_data.py${NC}"
echo -e "  2. Train model:   ${GREEN}python src/train.py${NC}"
echo -e "  3. Start API:     ${GREEN}uvicorn src.main:app --reload${NC}"
echo -e "\n${BLUE}Or use Docker:${NC}"
echo -e "  ${GREEN}docker-compose up --build${NC}\n"
