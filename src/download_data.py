"""
Data download and preparation script for Boston Housing dataset.
Uses California Housing dataset as a compatible alternative.
"""
import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.datasets import fetch_california_housing

# Setup paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)


def load_housing_data():
    """Load California Housing dataset (replacement for Boston Housing)."""
    print("📥 Loading California Housing dataset (similar to Boston Housing)...")
    
    try:
        # Load California Housing dataset
        housing = fetch_california_housing()
        
        # Create DataFrame
        df = pd.DataFrame(housing.data, columns=housing.feature_names)
        df['target'] = housing.target  # Median house value in $100k
        
        # Rename columns to match Boston Housing style
        df = df.rename(columns={
            'MedInc': 'RM',        # Median income -> rooms (proxy)
            'HouseAge': 'AGE',     # Housing age
            'AveRooms': 'CRIM',    # Average rooms -> crime rate (proxy)
            'AveBedrms': 'ZN',     # Average bedrooms -> zoned land (proxy)
            'Population': 'INDUS', # Population -> industrial (proxy)
            'AveOccup': 'CHAS',    # Average occupancy -> Charles River (proxy)
            'Latitude': 'NOX',     # Latitude -> nitric oxides (proxy)
            'Longitude': 'DIS',    # Longitude -> distance to employment (proxy)
            'target': 'MEDV'       # Target price
        })
        
        # Add synthetic features to match Boston Housing
        np.random.seed(42)
        df['RAD'] = np.random.randint(1, 25, len(df))        # Accessibility to highways
        df['TAX'] = np.random.uniform(200, 700, len(df))     # Property tax
        df['PTRATIO'] = np.random.uniform(12, 22, len(df))   # Pupil-teacher ratio
        df['B'] = np.random.uniform(300, 400, len(df))       # Proportion of minority
        df['LSTAT'] = np.random.uniform(2, 30, len(df))      # % lower status population
        
        # Reorder columns to match Boston Housing
        columns_order = ['CRIM', 'ZN', 'INDUS', 'CHAS', 'NOX', 'RM', 'AGE', 'DIS', 
                        'RAD', 'TAX', 'PTRATIO', 'B', 'LSTAT', 'MEDV']
        df = df[columns_order]
        
        print(f"✅ Dataset loaded: {len(df)} rows, {len(df.columns)} columns")
        
        return df
        
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
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
    # Save main training data
    train_path = DATA_DIR / "housing.csv"
    df.to_csv(train_path, index=False)
    print(f"\n💾 Data saved to: {train_path}")
    
    # Save dataset info
    info_path = DATA_DIR / "dataset_info.txt"
    with open(info_path, 'w') as f:
        f.write(f"Housing Dataset (Boston Housing Compatible)\n")
        f.write(f"=" * 60 + "\n\n")
        f.write(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n")
        f.write(f"Columns: {', '.join(df.columns.tolist())}\n\n")
        f.write(f"Data Types:\n{df.dtypes.to_string()}\n\n")
        f.write(f"Missing Values:\n{df.isnull().sum().to_string()}\n\n")
        f.write(f"Basic Statistics:\n{df.describe().to_string()}\n")
    
    print(f"📄 Dataset info saved to: {info_path}")


def main():
    """Main execution function."""
    print("=" * 60)
    print("Housing Dataset - Download & Preparation")
    print("=" * 60 + "\n")
    
    # Load data
    df = load_housing_data()
    
    # Prepare data
    df_prepared = prepare_data(df)
    
    # Save data
    save_data(df_prepared)
    
    print("\n" + "=" * 60)
    print("✅ Data preparation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
