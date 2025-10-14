"""
Housing Price Prediction MLOps System

A complete MLOps solution for predicting housing prices with:
- Reproducible ML pipeline
- REST API for predictions
- MLflow experiment tracking
- Production monitoring
- Docker containerization
"""

__version__ = "1.0.0"
__author__ = "Mateo Restrepo"

from .config import settings
from .data_preparation import DataPreprocessor
from .monitoring import monitor

__all__ = ["settings", "DataPreprocessor", "monitor"]
