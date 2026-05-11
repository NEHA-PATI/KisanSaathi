from pathlib import Path

import joblib
import pandas as pd

from .features import build_features
from .mldatasets import build_dataset


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "processed"
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "state_model.pkl"

# Load model
model, X_cols, Y_cols = joblib.load(MODEL_PATH)

# Load latest data
df = pd.read_parquet(DATA_DIR / "final.parquet")

df = build_features(df)
df, _, _ = build_dataset(df)

# Predict
pred = model.predict(df[X_cols])
pred_df = pd.DataFrame(pred, columns=Y_cols, index=df.index)

# Attach identifiers
out = df[["cell_id", "date"]].copy()
out = pd.concat([out, pred_df], axis=1)

out.to_parquet(DATA_DIR / "predictions.parquet", index=False)

print("predictions generated")
