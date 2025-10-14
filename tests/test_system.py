"""
Unit tests for the housing price prediction system.
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from preprocessing import DataPreprocessor
from monitoring import ModelMonitor


class TestDataPreprocessor:
    """Tests for DataPreprocessor class."""

    def test_initialization(self):
        """Test preprocessor initialization."""
        preprocessor = DataPreprocessor()
        assert preprocessor.scaler is not None
        assert preprocessor.feature_names is None
        assert preprocessor.target_name is None

    def test_identify_features(self):
        """Test feature identification."""
        df = pd.DataFrame(
            {"feature1": [1, 2, 3], "feature2": [4, 5, 6], "MEDV": [10, 20, 30]}
        )

        preprocessor = DataPreprocessor()
        features, target = preprocessor.identify_features(df)

        assert target == "MEDV"
        assert "feature1" in features
        assert "feature2" in features
        assert "MEDV" not in features

    def test_clean_data(self):
        """Test data cleaning."""
        df = pd.DataFrame(
            {"A": [1, 2, np.nan, 4], "B": [5, 6, 7, 8], "target": [10, 20, 30, 40]}
        )

        preprocessor = DataPreprocessor()
        df_cleaned = preprocessor.clean_data(df)

        assert df_cleaned.isnull().sum().sum() == 0

    def test_split_train_test(self):
        """Test train/test split."""
        X = pd.DataFrame(np.random.rand(100, 5))
        y = pd.Series(np.random.rand(100))

        preprocessor = DataPreprocessor()
        X_train, X_test, y_train, y_test = preprocessor.split_train_test(
            X, y, test_size=0.2, random_state=42
        )

        assert len(X_train) == 80
        assert len(X_test) == 20
        assert len(y_train) == 80
        assert len(y_test) == 20

    def test_scale_features(self):
        """Test feature scaling."""
        X_train = pd.DataFrame(np.random.rand(100, 5))
        X_test = pd.DataFrame(np.random.rand(20, 5))

        preprocessor = DataPreprocessor()
        X_train_scaled, X_test_scaled = preprocessor.scale_features(X_train, X_test)

        assert X_train_scaled.shape == X_train.shape
        assert X_test_scaled.shape == X_test.shape

        # Check that training data is roughly standardized
        assert np.abs(X_train_scaled.mean()) < 0.1
        assert np.abs(X_train_scaled.std() - 1.0) < 0.1


class TestModelMonitor:
    """Tests for ModelMonitor class."""

    def test_initialization(self):
        """Test monitor initialization."""
        monitor = ModelMonitor(max_history=100)
        assert len(monitor.predictions_history) == 0
        assert len(monitor.inference_times) == 0

    def test_log_prediction(self):
        """Test prediction logging."""
        monitor = ModelMonitor()

        features = {"feature1": 1.0, "feature2": 2.0}
        prediction = 25.5
        inference_time = 0.01

        monitor.log_prediction(features, prediction, inference_time)

        assert len(monitor.predictions_history) == 1
        assert len(monitor.inference_times) == 1
        assert monitor.predictions_history[0]["prediction"] == prediction

    def test_get_metrics(self):
        """Test metrics calculation."""
        monitor = ModelMonitor()

        # Add some predictions
        for i in range(10):
            features = {"feature": float(i)}
            monitor.log_prediction(features, float(i * 10), 0.01 * (i + 1))

        metrics = monitor.get_metrics()

        assert metrics["total_predictions"] == 10
        assert "avg_inference_time" in metrics
        assert "avg_prediction" in metrics
        assert metrics["total_predictions"] == 10

    def test_health_status(self):
        """Test health status."""
        monitor = ModelMonitor()

        status = monitor.get_health_status()

        assert "status" in status
        assert "uptime_hours" in status
        assert "total_predictions" in status
        assert isinstance(status["warnings"], list)


class TestAPI:
    """Tests for FastAPI endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from main import app

        return TestClient(app)

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data

    def test_metrics_endpoint(self, client):
        """Test metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_predictions" in data
        assert "uptime_hours" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
