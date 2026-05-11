from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data" / "processed"
INPUT_PATH = DATA_DIR / "predictions.parquet"
OUTPUT_PATH = DATA_DIR / "predictions_clean.parquet"

print("Loading parquet...")

df = pd.read_parquet(INPUT_PATH)

print("Original shape:", df.shape)

if "cell_id" not in df.columns:
    raise ValueError("Expected a 'cell_id' column in predictions parquet")

print("Unique cells:", df["cell_id"].nunique())

# Keep the latest complete row per cell.
if "date" in df.columns:
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["cell_id", "date"]).drop_duplicates(
        subset=["cell_id"], keep="last"
    )
else:
    df = df.drop_duplicates(subset=["cell_id"], keep="last")

df = df.reset_index(drop=True)

print("After cleanup:", df.shape)
print("Unique cells after cleanup:", df["cell_id"].nunique())

dup = df["cell_id"].duplicated().sum()

print("Remaining duplicates:", dup)

df.to_parquet(OUTPUT_PATH, index=False)

print(f"Saved cleaned parquet: {OUTPUT_PATH}")
