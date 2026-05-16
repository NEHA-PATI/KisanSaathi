from pathlib import Path
import sys

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import get_district_config
from ml.derive_signals import derive

DB_COLUMNS = [
    "grid_id",
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
    import argparse

    parser = argparse.ArgumentParser(description="Prepare district prediction metrics for DB.")
    parser.add_argument("--district", help="District key from district_config.json")
    args = parser.parse_args()

    config = get_district_config(args.district)
    data_dir = config.processed_dir
    predictions_path = data_dir / "predictions.parquet"
    output_path = data_dir / "db_ready.csv"

    df = pd.read_parquet(predictions_path)
    grid = pd.read_csv(config.grid_path)

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
        predictions_path,
    )
    require_columns(grid, ["cell_id", "lat", "lon"], config.grid_path)
    if "grid_id" not in grid.columns:
        from scripts.schema_utils import global_grid_id

        grid["grid_id"] = grid.apply(
            lambda row: global_grid_id(
                row["lat"],
                row["lon"],
                config.grid_cell_size_deg,
            ),
            axis=1,
        )

    df = derive(df)
    df = df.merge(grid[["cell_id", "grid_id", "lat", "lon"]], on="cell_id", how="left")
    require_columns(df, DB_COLUMNS, "prepared dataframe")

    db_ready = df[DB_COLUMNS].copy()
    db_ready.to_csv(output_path, index=False)

    missing_locations = db_ready[["lat", "lon"]].isna().any(axis=1).sum()
    print(f"DB file ready: {output_path}")
    print(f"Rows: {len(db_ready):,}")
    print(f"Columns: {len(db_ready.columns)}")
    print(f"Rows missing lat/lon: {missing_locations:,}")


if __name__ == "__main__":
    main()
