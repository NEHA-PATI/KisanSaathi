from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import mean_absolute_error


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "processed"
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "state_model.pkl"

df = pd.read_parquet(DATA_DIR / "train_dataset.parquet")
df["date"] = pd.to_datetime(df["date"], errors="coerce")

cut = df["date"].quantile(0.8)
test = df[df["date"] > cut]

model, X_cols, Y_cols = joblib.load(MODEL_PATH)

pred = model.predict(test[X_cols])

for i, col in enumerate(Y_cols):
    mae = mean_absolute_error(test[col], pred[:, i])
    print(col, mae)
