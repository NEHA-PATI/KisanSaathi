from pathlib import Path
import sys

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data" / "processed"
GRID_PATH = PROJECT_ROOT / "data" / "grids" / "sambalpur_grid.csv"
PREDICTIONS_PATH = DATA_DIR / "predictions_clean.parquet"
OUTPUT_PATH = DATA_DIR / "db_ready.csv"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.derive_signals import derive

DB_COLUMNS = [
    "cell_id",
    "date",
    "lat",
    "lon",
    "ndvi_pred",
    "soil_moisture_pred",
    "water_stress",
    "heat_stress",
    "health_score",
    "irrigation_need_pct",
    "irrigation_needed",
    "risk_flag",
]


def require_columns(df, columns, source):
    missing = sorted(set(columns) - set(df.columns))
    if missing:
        raise ValueError(f"{source} is missing required columns: {missing}")


def main():
    df = pd.read_parquet(PREDICTIONS_PATH)
    grid = pd.read_csv(GRID_PATH)

    require_columns(
        df,
        [
            "cell_id",
            "date",
            "ndvi_t1",
            "soil_moisture_t1",
            "temperature_t1",
            "et_t1",
            "rain_30d_t1",
        ],
        PREDICTIONS_PATH,
    )
    require_columns(grid, ["cell_id", "lat", "lon"], GRID_PATH)

    df = derive(df)
    df = df.merge(grid[["cell_id", "lat", "lon"]], on="cell_id", how="left")
    require_columns(df, DB_COLUMNS, "prepared dataframe")

    db_ready = df[DB_COLUMNS].copy()
    db_ready.to_csv(OUTPUT_PATH, index=False)

    missing_locations = db_ready[["lat", "lon"]].isna().any(axis=1).sum()
    print(f"DB file ready: {OUTPUT_PATH}")
    print(f"Rows: {len(db_ready):,}")
    print(f"Columns: {len(db_ready.columns)}")
    print(f"Rows missing lat/lon: {missing_locations:,}")


if __name__ == "__main__":
    main()
