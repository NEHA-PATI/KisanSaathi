from pathlib import Path

import joblib
import pandas as pd
from sklearn.multioutput import MultiOutputRegressor
from xgboost import XGBRegressor

from .mldatasets import build_dataset


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "processed"
MODEL_DIR = PROJECT_ROOT / "ml" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_parquet(DATA_DIR / "features.parquet")

df, X_cols, Y_cols = build_dataset(df)

X = df[X_cols]
Y = df[Y_cols]

model = MultiOutputRegressor(
    XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05, tree_method="hist")
)

model.fit(X, Y)

joblib.dump((model, X_cols, Y_cols), MODEL_DIR / "state_model.pkl")

print("trained")
