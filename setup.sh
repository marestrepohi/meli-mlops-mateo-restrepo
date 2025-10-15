#!/bin/bash
# Setup script para configurar el entorno de desarrollo local

set -e

echo "🚀 Housing Price Prediction - Setup Script"
echo "==========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar Python
echo "1️⃣ Verificando Python..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
print_success "Python encontrado: $PYTHON_VERSION"

# Crear ambiente virtual
echo ""
echo "2️⃣ Creando ambiente virtual..."
if [ -d "venv" ]; then
    print_warning "Ambiente virtual ya existe, saltando..."
else
    python3 -m venv venv
    print_success "Ambiente virtual creado"
fi

# Activar ambiente virtual
echo ""
echo "3️⃣ Activando ambiente virtual..."
source venv/bin/activate
print_success "Ambiente virtual activado"

# Instalar dependencias
echo ""
echo "4️⃣ Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
print_success "Dependencias instaladas"

# Verificar estructura de directorios
echo ""
echo "5️⃣ Creando estructura de directorios..."
mkdir -p data/raw data/processed data/predictions data/reports
mkdir -p models/production/latest
mkdir -p logs
mkdir -p mlruns
print_success "Directorios creados"

# Verificar archivo .env
echo ""
echo "6️⃣ Verificando configuración..."
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado"
    echo "Creando .env de ejemplo..."
    cat > .env << EOF
# Kaggle API Credentials
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_api_key

# MLflow Configuration
MLFLOW_TRACKING_URI=./mlruns

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
EOF
    print_warning "⚠️  Edita .env con tus credenciales de Kaggle"
else
    print_success "Archivo .env encontrado"
fi

# Verificar DVC
echo ""
echo "7️⃣ Inicializando DVC..."
if [ ! -d ".dvc" ]; then
    dvc init
    print_success "DVC inicializado"
else
    print_success "DVC ya está inicializado"
fi

# Tests
echo ""
echo "8️⃣ Ejecutando tests..."
if [ -d "tests" ]; then
    pytest tests/ -v --tb=short || print_warning "Algunos tests fallaron"
else
    print_warning "No se encontró directorio de tests"
fi

echo ""
echo "==========================================="
print_success "🎉 Setup completado exitosamente!"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Edita .env con tus credenciales de Kaggle"
echo "   2. Ejecuta: source venv/bin/activate"
echo "   3. Ejecuta: dvc repro"
echo "   4. Ejecuta: uvicorn api.main:app --reload"
echo ""
echo "🐳 O usa Docker:"
echo "   docker-compose up --build"
echo ""
echo "📚 Documentación:"
echo "   - README.md - Guía principal"
echo "   - .github/WORKFLOWS_SETUP.md - Setup de CI/CD"
echo ""
