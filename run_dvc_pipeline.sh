#!/bin/bash
# =====================================================================
# DVC Pipeline Runner
# Ejecuta el pipeline completo de MLOps con DVC
# =====================================================================

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════════"
echo "   🚀 DVC Pipeline - Housing Price Prediction"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if DVC is installed
if ! command -v dvc &> /dev/null; then
    print_error "DVC is not installed. Installing..."
    pip install dvc
    print_success "DVC installed successfully"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Please create it with Kaggle credentials."
    exit 1
fi

print_step "Checking DVC status..."
dvc status

echo ""
print_step "Running DVC pipeline..."
echo "────────────────────────────────────────────────────────────────"

# Run specific stage or full pipeline
if [ $# -eq 0 ]; then
    # Run full pipeline
    print_step "Running FULL pipeline (all stages)..."
    dvc repro
else
    # Run specific stage
    STAGE=$1
    print_step "Running stage: $STAGE"
    dvc repro $STAGE
fi

print_success "Pipeline execution completed!"

echo ""
print_step "Generating metrics report..."
dvc metrics show

echo ""
print_step "DVC DAG (Pipeline visualization)..."
dvc dag

echo ""
print_success "Pipeline completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "  - View metrics: dvc metrics show"
echo "  - Compare experiments: dvc metrics diff"
echo "  - View plots: dvc plots show"
echo "  - Push to remote: dvc push"
echo ""
