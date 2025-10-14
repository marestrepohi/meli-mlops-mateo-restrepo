"""
Data preprocessing pipeline for Boston Housing dataset.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from typing import Tuple
import joblib
from pathlib import Path


class DataPreprocessor:
    """Handles data preprocessing for the housing price prediction model."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = None
        self.target_name = None

    def load_data(self, data_path: Path) -> pd.DataFrame:
        """Load data from CSV file."""
        print(f"📂 Loading data from {data_path}...")
        df = pd.read_csv(data_path)
        print(f"✅ Data loaded: {df.shape}")
        return df

    def identify_features(
        self, df: pd.DataFrame, target_col: str = None
    ) -> Tuple[list, str]:
        """
        Identify feature columns and target column.

        Args:
            df: Input dataframe
            target_col: Name of target column (if None, assumes last column or 'MEDV')

        Returns:
            Tuple of (feature_names, target_name)
        """
        # Common target column names for Boston Housing
        possible_targets = ["MEDV", "medv", "price", "Price", "target"]

        if target_col and target_col in df.columns:
            self.target_name = target_col
        else:
            # Try to find target column
            for col in possible_targets:
                if col in df.columns:
                    self.target_name = col
                    break

            # If still not found, use last column
            if not self.target_name:
                self.target_name = df.columns[-1]

        # All other columns are features
        self.feature_names = [col for col in df.columns if col != self.target_name]

        print(f"🎯 Target column: {self.target_name}")
        print(f"📊 Feature columns ({len(self.feature_names)}): {self.feature_names}")

        return self.feature_names, self.target_name

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean data by handling missing values and outliers."""
        print("🧹 Cleaning data...")

        # Handle missing values
        missing = df.isnull().sum()
        if missing.any():
            print(f"⚠️  Found missing values:\n{missing[missing > 0]}")
            # Fill numeric columns with median
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
            print("✅ Missing values filled with median")

        # Remove duplicates
        original_len = len(df)
        df = df.drop_duplicates()
        if len(df) < original_len:
            print(f"🗑️  Removed {original_len - len(df)} duplicate rows")

        return df

    def split_features_target(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Split dataframe into features and target."""
        X = df[self.feature_names]
        y = df[self.target_name]
        return X, y

    def split_train_test(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2,
        random_state: int = 42,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """Split data into training and testing sets."""
        print(
            f"✂️  Splitting data: {int((1-test_size)*100)}% train, {int(test_size*100)}% test"
        )

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        print(f"   Training set: {X_train.shape}")
        print(f"   Test set: {X_test.shape}")

        return X_train, X_test, y_train, y_test

    def scale_features(
        self, X_train: pd.DataFrame, X_test: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Scale features using StandardScaler."""
        print("📏 Scaling features...")

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        print("✅ Features scaled")

        return X_train_scaled, X_test_scaled

    def save_preprocessor(self, path: Path):
        """Save the preprocessor state (scaler and feature names)."""
        preprocessor_data = {
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "target_name": self.target_name,
        }
        joblib.dump(preprocessor_data, path)
        print(f"💾 Preprocessor saved to {path}")

    def load_preprocessor(self, path: Path):
        """Load the preprocessor state."""
        preprocessor_data = joblib.load(path)
        self.scaler = preprocessor_data["scaler"]
        self.feature_names = preprocessor_data["feature_names"]
        self.target_name = preprocessor_data["target_name"]
        print(f"📂 Preprocessor loaded from {path}")

    def preprocess_for_inference(self, input_data: dict) -> np.ndarray:
        """
        Preprocess input data for model inference.

        Args:
            input_data: Dictionary with feature values

        Returns:
            Scaled feature array ready for prediction
        """
        # Convert to DataFrame
        df = pd.DataFrame([input_data])

        # Ensure correct column order
        df = df[self.feature_names]

        # Scale
        scaled_data = self.scaler.transform(df)

        return scaled_data
