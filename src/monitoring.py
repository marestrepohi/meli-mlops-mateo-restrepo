"""
Monitoring utilities for model performance and data drift detection.
"""

import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import json
import numpy as np
from collections import deque

from config import settings

# Setup logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class ModelMonitor:
    """Monitor model predictions and performance in production."""

    def __init__(self, max_history: int = 1000):
        """
        Initialize monitor.

        Args:
            max_history: Maximum number of predictions to keep in memory
        """
        self.predictions_history = deque(maxlen=max_history)
        self.inference_times = deque(maxlen=max_history)
        self.feature_stats = {}
        self.start_time = time.time()

        # Logs directory
        from pathlib import Path

        self.logs_dir = Path(__file__).parent.parent / "logs"
        self.logs_dir.mkdir(exist_ok=True)

    def log_prediction(self, features: Dict, prediction: float, inference_time: float):
        """
        Log a prediction for monitoring.

        Args:
            features: Input features
            prediction: Model prediction
            inference_time: Time taken for inference (seconds)
        """
        record = {
            "timestamp": datetime.now().isoformat(),
            "features": features,
            "prediction": prediction,
            "inference_time": inference_time,
        }

        self.predictions_history.append(record)
        self.inference_times.append(inference_time)

        # Update feature statistics
        for key, value in features.items():
            if key not in self.feature_stats:
                self.feature_stats[key] = []
            self.feature_stats[key].append(value)

    def get_metrics(self) -> Dict:
        """
        Get current monitoring metrics.

        Returns:
            Dictionary with monitoring metrics
        """
        if not self.predictions_history:
            return {
                "total_predictions": 0,
                "avg_inference_time": 0,
                "uptime_hours": (time.time() - self.start_time) / 3600,
            }

        predictions = [p["prediction"] for p in self.predictions_history]

        metrics = {
            "total_predictions": len(self.predictions_history),
            "avg_inference_time": np.mean(self.inference_times),
            "p50_inference_time": np.percentile(self.inference_times, 50),
            "p95_inference_time": np.percentile(self.inference_times, 95),
            "p99_inference_time": np.percentile(self.inference_times, 99),
            "avg_prediction": np.mean(predictions),
            "std_prediction": np.std(predictions),
            "min_prediction": np.min(predictions),
            "max_prediction": np.max(predictions),
            "uptime_hours": (time.time() - self.start_time) / 3600,
        }

        return metrics

    def detect_drift(self, baseline_stats: Dict = None) -> Dict:
        """
        Detect data drift by comparing current feature statistics with baseline.

        Args:
            baseline_stats: Baseline statistics to compare against

        Returns:
            Dictionary with drift information
        """
        if not self.feature_stats:
            return {"drift_detected": False, "message": "No data available"}

        drift_info = {
            "drift_detected": False,
            "features_drifted": [],
            "current_stats": {},
        }

        # Calculate current statistics
        for feature, values in self.feature_stats.items():
            current_mean = np.mean(values)
            current_std = np.std(values)

            drift_info["current_stats"][feature] = {
                "mean": float(current_mean),
                "std": float(current_std),
                "min": float(np.min(values)),
                "max": float(np.max(values)),
            }

            # Check for drift if baseline is provided
            if baseline_stats and feature in baseline_stats:
                baseline_mean = baseline_stats[feature]["mean"]
                baseline_std = baseline_stats[feature]["std"]

                # Simple drift detection: if mean shifted > 2 standard deviations
                if abs(current_mean - baseline_mean) > 2 * baseline_std:
                    drift_info["drift_detected"] = True
                    drift_info["features_drifted"].append(
                        {
                            "feature": feature,
                            "baseline_mean": baseline_mean,
                            "current_mean": current_mean,
                            "difference": current_mean - baseline_mean,
                        }
                    )

        return drift_info

    def save_logs(self):
        """Save prediction logs to disk."""
        if not self.predictions_history:
            logger.info("No predictions to save")
            return

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = self.logs_dir / f"predictions_{timestamp}.json"

        logs = list(self.predictions_history)

        with open(log_file, "w") as f:
            json.dump(logs, f, indent=2)

        logger.info(f"Saved {len(logs)} prediction logs to {log_file}")

    def get_health_status(self) -> Dict:
        """
        Get health status of the model service.

        Returns:
            Dictionary with health status
        """
        metrics = self.get_metrics()

        # Determine health based on metrics
        health = "healthy"
        warnings = []

        # Check inference time
        if metrics["total_predictions"] > 0:
            if metrics["p95_inference_time"] > 1.0:  # More than 1 second
                health = "degraded"
                warnings.append("High inference latency detected")

            # Check if predictions are varying (not stuck)
            if metrics["std_prediction"] < 0.01:
                health = "warning"
                warnings.append("Low prediction variance - model might be stuck")

        status = {
            "status": health,
            "uptime_hours": metrics["uptime_hours"],
            "total_predictions": metrics["total_predictions"],
            "warnings": warnings,
            "timestamp": datetime.now().isoformat(),
        }

        return status


# Global monitor instance
monitor = ModelMonitor()
