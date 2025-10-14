"""
Monitoring module for tracking predictions and performance metrics.
"""

import time
from typing import Dict, List
from collections import deque
import numpy as np


class PredictionMonitor:
    """Monitor predictions and API performance."""
    
    def __init__(self, max_history: int = 1000):
        """
        Initialize monitor.
        
        Args:
            max_history: Maximum number of predictions to keep in history
        """
        self.start_time = time.time()
        self.prediction_count = 0
        self.predictions = deque(maxlen=max_history)
        self.inference_times = deque(maxlen=max_history)
        self.features_log = deque(maxlen=max_history)
        
    def log_prediction(
        self,
        features: Dict,
        prediction: float,
        inference_time: float
    ) -> None:
        """
        Log a prediction for monitoring.
        
        Args:
            features: Input features used for prediction
            prediction: Model prediction value
            inference_time: Time taken for inference (in ms)
        """
        self.prediction_count += 1
        self.predictions.append(prediction)
        self.inference_times.append(inference_time)
        self.features_log.append(features)
        
    def get_metrics(self) -> Dict:
        """
        Get monitoring metrics.
        
        Returns:
            Dictionary with monitoring metrics
        """
        uptime = time.time() - self.start_time
        
        metrics = {
            "total_predictions": self.prediction_count,
            "uptime_seconds": uptime,
            "uptime_hours": uptime / 3600,
        }
        
        # Prediction statistics
        if self.predictions:
            metrics.update({
                "avg_prediction": float(np.mean(self.predictions)),
                "std_prediction": float(np.std(self.predictions)),
                "min_prediction": float(np.min(self.predictions)),
                "max_prediction": float(np.max(self.predictions)),
                "median_prediction": float(np.median(self.predictions)),
            })
        
        # Inference time statistics
        if self.inference_times:
            metrics.update({
                "avg_inference_time_ms": float(np.mean(self.inference_times)),
                "p50_inference_time_ms": float(np.percentile(self.inference_times, 50)),
                "p95_inference_time_ms": float(np.percentile(self.inference_times, 95)),
                "p99_inference_time_ms": float(np.percentile(self.inference_times, 99)),
                "max_inference_time_ms": float(np.max(self.inference_times)),
            })
        
        return metrics
    
    def get_health_status(self) -> Dict:
        """
        Get health status of the service.
        
        Returns:
            Dictionary with health status information
        """
        uptime = time.time() - self.start_time
        
        warnings = []
        
        # Check if inference times are reasonable
        if self.inference_times and np.mean(self.inference_times) > 1000:  # > 1 second
            warnings.append("High average inference time detected")
        
        # Check if predictions are in reasonable range
        if self.predictions:
            avg_pred = np.mean(self.predictions)
            if avg_pred < 5 or avg_pred > 100:  # Housing prices typically $5k-$100k
                warnings.append("Predictions outside typical range")
        
        status = "healthy" if len(warnings) == 0 else "warning"
        
        return {
            "status": status,
            "uptime_seconds": uptime,
            "uptime_hours": uptime / 3600,
            "total_predictions": self.prediction_count,
            "warnings": warnings,
        }
    
    def reset(self) -> None:
        """Reset monitoring statistics."""
        self.prediction_count = 0
        self.predictions.clear()
        self.inference_times.clear()
        self.features_log.clear()
