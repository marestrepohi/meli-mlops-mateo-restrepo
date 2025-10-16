"""
Módulo de configuración para el sistema de predicción de precios de viviendas.

Este módulo centraliza todas las configuraciones del proyecto usando Pydantic Settings.
Permite cargar configuraciones desde variables de entorno (.env) y define las rutas
principales del proyecto.
"""

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env
load_dotenv()

# ============================================================================
# RUTAS DEL PROYECTO
# ============================================================================
PROJECT_ROOT = Path(__file__).parent.parent  # Raíz del proyecto
DATA_DIR = PROJECT_ROOT / "data"             # Directorio de datos
MODELS_DIR = PROJECT_ROOT / "models"         # Directorio de modelos
LOGS_DIR = PROJECT_ROOT / "logs"             # Directorio de logs

# Crear directorios si no existen
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)


class Settings(BaseSettings):
    """
    Configuración de la aplicación.
    
    Esta clase define todos los parámetros configurables del sistema.
    Los valores pueden ser sobrescritos mediante variables de entorno.
    """

    # ========================================================================
    # CONFIGURACIÓN DE MLFLOW
    # ========================================================================
    mlflow_tracking_uri: str = str(PROJECT_ROOT / "mlruns")
    mlflow_experiment_name: str = "housing-price-prediction"

    # ========================================================================
    # CONFIGURACIÓN DE LA API
    # ========================================================================
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_title: str = "API de Predicción de Precios de Viviendas"
    api_version: str = "1.0.0"

    # ========================================================================
    # CONFIGURACIÓN DE DATOS
    # ========================================================================
    data_path: Path = DATA_DIR / "raw/HousingData.csv"
    raw_data_path: Optional[Path] = DATA_DIR / "raw"

    # ========================================================================
    # CONFIGURACIÓN DE MONITOREO
    # ========================================================================
    enable_monitoring: bool = True
    log_level: str = "INFO"

    # ========================================================================
    # PARÁMETROS DEL MODELO
    # ========================================================================
    random_state: int = 42      # Semilla para reproducibilidad
    test_size: float = 0.2      # Proporción de datos para prueba (20%)

    class Config:
        """Configuración de Pydantic."""
        env_file = ".env"
        case_sensitive = False
        extra = "allow"  # Permite campos adicionales desde variables de entorno


# ============================================================================
# INSTANCIA GLOBAL DE CONFIGURACIÓN
# ============================================================================
settings = Settings()
