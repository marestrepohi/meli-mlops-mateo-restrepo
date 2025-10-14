"""
Evaluate and compare trained models.
Generates comparison reports and metrics for DVC tracking.
"""

import json
import pandas as pd
import numpy as np
import joblib
import yaml
from pathlib import Path
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from typing import Dict, List
import matplotlib.pyplot as plt
import seaborn as sns

# Setup paths
PROJECT_ROOT = Path(__file__).parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
EVAL_DIR = MODELS_DIR / "evaluation"
DATA_DIR = PROJECT_ROOT / "data" / "processed"

# Create directories
EVAL_DIR.mkdir(exist_ok=True, parents=True)


def load_test_data():
    """Load test data."""
    X_test = pd.read_csv(DATA_DIR / "test.csv")
    y_test = X_test.pop("MEDV")  # Target column
    return X_test, y_test


def calculate_metrics(y_true, y_pred) -> Dict:
    """Calculate regression metrics."""
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    # MAPE (Mean Absolute Percentage Error)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    
    return {
        "mse": float(mse),
        "rmse": float(rmse),
        "mae": float(mae),
        "r2": float(r2),
        "mape": float(mape)
    }


def evaluate_model(model_path: Path, X_test: pd.DataFrame, y_test: pd.Series, model_name: str) -> Dict:
    """Evaluate a single model."""
    print(f"Evaluating {model_name}...")
    
    model = joblib.load(model_path)
    y_pred = model.predict(X_test)
    
    metrics = calculate_metrics(y_test, y_pred)
    
    return {
        "model": model_name,
        "metrics": metrics,
        "predictions": y_pred
    }


def create_comparison_plot(results: List[Dict]):
    """Create comparison plots for all models."""
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    models = [r["model"] for r in results]
    
    # RMSE comparison
    rmse_values = [r["metrics"]["rmse"] for r in results]
    axes[0, 0].bar(models, rmse_values, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
    axes[0, 0].set_title('RMSE Comparison', fontsize=14, fontweight='bold')
    axes[0, 0].set_ylabel('RMSE')
    axes[0, 0].tick_params(axis='x', rotation=45)
    
    # R² comparison
    r2_values = [r["metrics"]["r2"] for r in results]
    axes[0, 1].bar(models, r2_values, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
    axes[0, 1].set_title('R² Score Comparison', fontsize=14, fontweight='bold')
    axes[0, 1].set_ylabel('R² Score')
    axes[0, 1].tick_params(axis='x', rotation=45)
    axes[0, 1].set_ylim([0, 1])
    
    # MAE comparison
    mae_values = [r["metrics"]["mae"] for r in results]
    axes[1, 0].bar(models, mae_values, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
    axes[1, 0].set_title('MAE Comparison', fontsize=14, fontweight='bold')
    axes[1, 0].set_ylabel('MAE')
    axes[1, 0].tick_params(axis='x', rotation=45)
    
    # MAPE comparison
    mape_values = [r["metrics"]["mape"] for r in results]
    axes[1, 1].bar(models, mape_values, color=['#1f77b4', '#ff7f0e', '#2ca02c'])
    axes[1, 1].set_title('MAPE Comparison (%)', fontsize=14, fontweight='bold')
    axes[1, 1].set_ylabel('MAPE (%)')
    axes[1, 1].tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig(EVAL_DIR / "models_comparison.png", dpi=300, bbox_inches='tight')
    print(f"✅ Comparison plot saved to {EVAL_DIR / 'models_comparison.png'}")
    plt.close()


def main():
    """Main evaluation function."""
    print("=" * 80)
    print("Model Evaluation - Comparing All Trained Models")
    print("=" * 80)
    
    # Load test data
    X_test, y_test = load_test_data()
    print(f"✅ Loaded test data: {X_test.shape}")
    
    # Models to evaluate
    models_to_eval = [
        ("xgboost_baseline.pkl", "XGBoost Baseline"),
        ("xgboost_tuned.pkl", "XGBoost Tuned"),
        ("xgboost_final.pkl", "XGBoost Final"),
    ]
    
    results = []
    
    for model_file, model_name in models_to_eval:
        model_path = MODELS_DIR / model_file
        if model_path.exists():
            result = evaluate_model(model_path, X_test, y_test, model_name)
            results.append(result)
        else:
            print(f"⚠️  Model not found: {model_file}")
    
    if not results:
        print("❌ No models found for evaluation")
        return
    
    # Create comparison metrics
    comparison_metrics = {}
    comparison_data = []
    
    for result in results:
        model_name = result["model"]
        metrics = result["metrics"]
        
        comparison_metrics[model_name] = metrics
        comparison_data.append({
            "model": model_name,
            "rmse": metrics["rmse"],
            "mae": metrics["mae"],
            "r2": metrics["r2"],
            "mape": metrics["mape"]
        })
    
    # Save comparison metrics for DVC
    with open(EVAL_DIR / "metrics_comparison.json", "w") as f:
        json.dump(comparison_metrics, f, indent=2)
    print(f"✅ Metrics saved to {EVAL_DIR / 'metrics_comparison.json'}")
    
    # Save comparison data for plots
    comparison_df = pd.DataFrame(comparison_data)
    comparison_df.to_csv(EVAL_DIR / "models_comparison.csv", index=False)
    print(f"✅ Comparison data saved to {EVAL_DIR / 'models_comparison.csv'}")
    
    # Save detailed comparison JSON
    with open(EVAL_DIR / "model_comparison.json", "w") as f:
        json.dump({
            "models": comparison_data,
            "best_model": min(comparison_data, key=lambda x: x["rmse"])
        }, f, indent=2)
    
    # Create comparison plots
    create_comparison_plot(results)
    
    # Generate HTML report
    html_report = f"""
    <html>
    <head>
        <title>Model Comparison Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: center; }}
            th {{ background-color: #4CAF50; color: white; }}
            tr:nth-child(even) {{ background-color: #f2f2f2; }}
            .best {{ background-color: #90EE90 !important; font-weight: bold; }}
            h1 {{ color: #333; }}
        </style>
    </head>
    <body>
        <h1>Model Comparison Report</h1>
        <p>Generated on: {pd.Timestamp.now()}</p>
        
        <h2>Metrics Comparison</h2>
        <table>
            <tr>
                <th>Model</th>
                <th>RMSE ↓</th>
                <th>MAE ↓</th>
                <th>R² ↑</th>
                <th>MAPE (%) ↓</th>
            </tr>
    """
    
    best_model = min(comparison_data, key=lambda x: x["rmse"])["model"]
    
    for data in comparison_data:
        row_class = 'class="best"' if data["model"] == best_model else ''
        html_report += f"""
            <tr {row_class}>
                <td>{data["model"]}</td>
                <td>{data["rmse"]:.4f}</td>
                <td>{data["mae"]:.4f}</td>
                <td>{data["r2"]:.4f}</td>
                <td>{data["mape"]:.2f}%</td>
            </tr>
        """
    
    html_report += """
        </table>
        
        <h2>Visualization</h2>
        <img src="models_comparison.png" alt="Models Comparison" style="max-width: 100%;">
        
        <h2>Conclusion</h2>
        <p><strong>Best Model:</strong> {}</p>
        <p>The model with the lowest RMSE is highlighted in green.</p>
    </body>
    </html>
    """.format(best_model)
    
    with open(EVAL_DIR / "comparison_report.html", "w") as f:
        f.write(html_report)
    print(f"✅ HTML report saved to {EVAL_DIR / 'comparison_report.html'}")
    
    print("\n" + "=" * 80)
    print("Evaluation Summary:")
    print("=" * 80)
    for data in comparison_data:
        print(f"\n{data['model']}:")
        print(f"  RMSE: {data['rmse']:.4f}")
        print(f"  MAE:  {data['mae']:.4f}")
        print(f"  R²:   {data['r2']:.4f}")
        print(f"  MAPE: {data['mape']:.2f}%")
    
    print(f"\n🏆 Best Model: {best_model}")
    print("=" * 80)


if __name__ == "__main__":
    main()
