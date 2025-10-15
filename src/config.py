"""
Configuration module for the housing price prediction system.
"""

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
LOGS_DIR = PROJECT_ROOT / "logs"

# Create directories
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)


class Settings(BaseSettings):
    """Application settings."""

    # MLflow
    mlflow_tracking_uri: str = str(PROJECT_ROOT / "mlruns")
    mlflow_experiment_name: str = "housing-price-prediction"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_title: str = "Housing Price Prediction API"
    api_version: str = "1.0.0"

    # Data
    data_path: Path = DATA_DIR / "raw/HousingData.csv"
    raw_data_path: Optional[Path] = DATA_DIR / "raw"

    # Monitoring
    enable_monitoring: bool = True
    log_level: str = "INFO"

    # Model parameters
    random_state: int = 42
    test_size: float = 0.2

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"  # Allow extra fields from environment


# Global settings instance
settings = Settings()
