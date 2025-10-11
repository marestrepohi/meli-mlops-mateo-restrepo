"""
Data download and preparation script for Boston Housing dataset.
Downloads data from Kaggle and prepares it for training.
"""
import os
import sys
from pathlib import Path

import pandas as pd
import kagglehub
from kagglehub import KaggleDatasetAdapter

# Setup paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
RAW_DATA_DIR.mkdir(exist_ok=True)


def download_boston_housing():
    """Download Boston Housing dataset from Kaggle."""
    print("📥 Downloading Boston Housing dataset from Kaggle...")
    
    try:
        # Set the path to the file you'd like to load
        file_path = ""
        
        # Load the latest version
        df = kagglehub.load_dataset(
            KaggleDatasetAdapter.PANDAS,
            "altavish/boston-housing-dataset",
            file_path,
        )
        
        print(f"✅ Dataset downloaded successfully!")
        print(f"📊 Shape: {df.shape}")
        print(f"📋 Columns: {df.columns.tolist()}")
        print("\nFirst 5 records:")
        print(df.head())
        
        return df
        
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        sys.exit(1)


def prepare_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic data preparation and validation.
    
    Args:
        df: Raw dataframe
        
    Returns:
        Prepared dataframe
    """
    print("\n🔧 Preparing data...")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    if missing_values.any():
        print(f"⚠️  Missing values found:\n{missing_values[missing_values > 0]}")
    else:
        print("✅ No missing values found")
    
    # Basic statistics
    print("\n📈 Dataset statistics:")
    print(df.describe())
    
    return df


def save_data(df: pd.DataFrame):
    """Save processed data to disk."""
    # Save raw data
    raw_path = RAW_DATA_DIR / "boston_housing_raw.csv"
    df.to_csv(raw_path, index=False)
    print(f"\n💾 Raw data saved to: {raw_path}")
    
    # Save a copy in the main data directory for training
    train_path = DATA_DIR / "boston_housing.csv"
    df.to_csv(train_path, index=False)
    print(f"💾 Training data saved to: {train_path}")
    
    # Save dataset info
    info_path = DATA_DIR / "dataset_info.txt"
    with open(info_path, 'w') as f:
        f.write(f"Boston Housing Dataset\n")
        f.write(f"=" * 50 + "\n\n")
        f.write(f"Shape: {df.shape}\n")
        f.write(f"Columns: {df.columns.tolist()}\n\n")
        f.write(f"Data Types:\n{df.dtypes}\n\n")
        f.write(f"Missing Values:\n{df.isnull().sum()}\n\n")
        f.write(f"Statistics:\n{df.describe()}\n")
    
    print(f"📄 Dataset info saved to: {info_path}")


def main():
    """Main execution function."""
    print("=" * 60)
    print("Boston Housing Dataset - Download & Preparation")
    print("=" * 60 + "\n")
    
    # Download data
    df = download_boston_housing()
    
    # Prepare data
    df_prepared = prepare_data(df)
    
    # Save data
    save_data(df_prepared)
    
    print("\n" + "=" * 60)
    print("✅ Data preparation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
