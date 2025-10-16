"""
Módulo de Monitoreo para seguimiento de predicciones y métricas de performance.
"""

import time
from typing import Dict, List, Optional
from collections import deque
from datetime import datetime
import numpy as np


class PredictionMonitor:
    """Monitor predicciones y performance de la API."""
    
    def __init__(self, max_history: int = 1000):
        """
        Inicializar el monitor.
        
        Args:
            max_history: Número máximo de predicciones para mantener en el historial
        """
        self.start_time = time.time()
        self.prediction_count = 0
        self.predictions = deque(maxlen=max_history)
        self.inference_times = deque(maxlen=max_history)
        self.features_log = deque(maxlen=max_history)
        self.timestamps = deque(maxlen=max_history)
        
        # Estadísticas baseline para detección de drift
        self.baseline_mean: Optional[float] = None
        self.baseline_std: Optional[float] = None
        self.baseline_features: Optional[Dict[str, Dict[str, float]]] = None
        
    def log_prediction(
        self,
        features: Dict,
        prediction: float,
        inference_time: float
    ) -> None:
        """
        Registra una predicción para monitoreo.
        
        Args:
            features: Features de entrada usadas para la predicción
            prediction: Valor de predicción del modelo
            inference_time: Tiempo de inferencia (en ms)
        """
        self.prediction_count += 1
        self.predictions.append(prediction)
        self.inference_times.append(inference_time)
        self.features_log.append(features)
        self.timestamps.append(datetime.now().isoformat())
        
    def set_baseline(self, predictions: List[float], features: Optional[Dict[str, List[float]]] = None) -> None:
        """
        Establece estadísticas baseline para detección de drift.
        
        Args:
            predictions: Predicciones históricas para usar como baseline
            features: Features históricas para usar como baseline (dict de nombre_feature -> lista de valores)
        """
        if predictions:
            self.baseline_mean = float(np.mean(predictions))
            self.baseline_std = float(np.std(predictions))
            
        if features:
            self.baseline_features = {}
            for feature_name, values in features.items():
                self.baseline_features[feature_name] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'min': float(np.min(values)),
                    'max': float(np.max(values))
                }
        
    def get_metrics(self) -> Dict:
        """
        Obtiene métricas de monitoreo.
        
        Returns:
            Diccionario con métricas de monitoreo
        """
        uptime = time.time() - self.start_time
        
        metrics = {
            "total_predictions": self.prediction_count,
            "uptime_seconds": uptime,
            "uptime_hours": uptime / 3600,
            "predictions_per_hour": self.prediction_count / (uptime / 3600) if uptime > 0 else 0,
        }
        
        # Estadísticas de predicciones
        if self.predictions:
            metrics.update({
                "avg_prediction": float(np.mean(self.predictions)),
                "std_prediction": float(np.std(self.predictions)),
                "min_prediction": float(np.min(self.predictions)),
                "max_prediction": float(np.max(self.predictions)),
                "median_prediction": float(np.median(self.predictions)),
            })
        
        # Estadísticas de tiempo de inferencia
        if self.inference_times:
            metrics.update({
                "avg_inference_time_ms": float(np.mean(self.inference_times)),
                "p50_inference_time_ms": float(np.percentile(self.inference_times, 50)),
                "p95_inference_time_ms": float(np.percentile(self.inference_times, 95)),
                "p99_inference_time_ms": float(np.percentile(self.inference_times, 99)),
                "max_inference_time_ms": float(np.max(self.inference_times)),
            })
        
        # Actividad reciente
        if self.timestamps:
            metrics["last_prediction_time"] = self.timestamps[-1]
            
        return metrics
    
    def get_detailed_stats(self) -> Dict:
        """
        Obtiene estadísticas de monitoreo detalladas.
        
        Returns:
            Estadísticas detalladas incluyendo detección de drift
        """
        uptime = time.time() - self.start_time
        
        stats = {
            "total_predictions": self.prediction_count,
            "uptime_hours": uptime / 3600,
            "predictions_per_hour": self.prediction_count / (uptime / 3600) if uptime > 0 else 0,
        }
        
        # Estadísticas de predicciones
        if self.predictions:
            stats["prediction_stats"] = {
                "mean": float(np.mean(self.predictions)),
                "std": float(np.std(self.predictions)),
                "min": float(np.min(self.predictions)),
                "max": float(np.max(self.predictions)),
                "median": float(np.median(self.predictions)),
                "q25": float(np.percentile(self.predictions, 25)),
                "q75": float(np.percentile(self.predictions, 75)),
            }
            stats["recent_predictions"] = list(self.predictions)[-10:]
        
        # Estadísticas de tiempo de inferencia
        if self.inference_times:
            stats["inference_stats"] = {
                "mean_ms": float(np.mean(self.inference_times)),
                "median_ms": float(np.median(self.inference_times)),
                "p50_ms": float(np.percentile(self.inference_times, 50)),
                "p95_ms": float(np.percentile(self.inference_times, 95)),
                "p99_ms": float(np.percentile(self.inference_times, 99)),
                "max_ms": float(np.max(self.inference_times)),
            }
        
        # Hora de la última predicción
        if self.timestamps:
            stats["last_prediction_time"] = self.timestamps[-1]
            
        return stats
    
    def detect_drift(self, threshold: float = 2.0) -> Dict:
        """
        Detecta drift en predicciones comparado con baseline.
        
        Args:
            threshold: Número de desviaciones estándar para detección de drift
            
        Returns:
            Diccionario con resultados de detección de drift
        """
        drift_info = {
            "drift_detected": False,
            "baseline_configured": self.baseline_mean is not None,
            "drift_score": None,
            "current_mean": None,
            "baseline_mean": self.baseline_mean,
            "baseline_std": self.baseline_std,
        }
        
        if not self.predictions or self.baseline_mean is None:
            return drift_info
        
        current_mean = float(np.mean(self.predictions))
        drift_info["current_mean"] = current_mean
        
        if self.baseline_std and self.baseline_std > 0:
            drift_score = abs(current_mean - self.baseline_mean) / self.baseline_std
            drift_info["drift_score"] = float(drift_score)
            drift_info["drift_detected"] = drift_score > threshold
            
        return drift_info
    
    def get_feature_stats(self) -> Dict:
        """
        Obtiene estadísticas para features utilizadas en predicciones recientes.
        
        Returns:
            Diccionario con estadísticas de features
        """
        if not self.features_log:
            return {}
        
        feature_stats = {}
        
        # Convertir features_log a diccionario de listas
        all_features = {}
        for features in self.features_log:
            for key, value in features.items():
                if key not in all_features:
                    all_features[key] = []
                all_features[key].append(value)
        
        # Calcular estadísticas para cada feature
        for feature_name, values in all_features.items():
            feature_stats[feature_name] = {
                "mean": float(np.mean(values)),
                "std": float(np.std(values)),
                "min": float(np.min(values)),
                "max": float(np.max(values)),
                "median": float(np.median(values)),
            }
            
            # Agregar info de drift si baseline existe
            if self.baseline_features and feature_name in self.baseline_features:
                baseline = self.baseline_features[feature_name]
                current_mean = feature_stats[feature_name]["mean"]
                baseline_mean = baseline["mean"]
                baseline_std = baseline["std"]
                
                if baseline_std > 0:
                    drift_score = abs(current_mean - baseline_mean) / baseline_std
                    feature_stats[feature_name]["drift_score"] = float(drift_score)
                    feature_stats[feature_name]["drift_detected"] = drift_score > 2.0
        
        return feature_stats
