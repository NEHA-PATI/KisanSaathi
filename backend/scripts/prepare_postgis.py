import argparse
import json
import sys
from pathlib import Path

import pandas as pd

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import get_district_config


def cell_geometry(row, cell_size):
    lat = float(row["lat"])
    lon = float(row["lon"])
    ring = [
        [lon, lat],
        [lon + cell_size, lat],
        [lon + cell_size, lat + cell_size],
        [lon, lat + cell_size],
        [lon, lat],
    ]
    return json.dumps({"type": "Polygon", "coordinates": [ring]})


def main():
    parser = argparse.ArgumentParser(description="Build district PostGIS-ready grid CSV.")
    parser.add_argument("--district", help="District key from district_config.json")
    args = parser.parse_args()

    config = get_district_config(args.district)
    grid = pd.read_csv(config.grid_path)
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
    metrics_path = config.processed_dir / "db_ready.csv"
    output_path = config.processed_dir / "postgis_ready.csv"

    metrics = pd.read_csv(metrics_path, usecols=["cell_id", "date", "health_score"])
    metrics["date"] = pd.to_datetime(metrics["date"], errors="coerce")
    metrics = (
        metrics.sort_values(["cell_id", "date"])
        .drop_duplicates("cell_id", keep="last")
        .drop(columns=["date"])
    )
    df = grid.merge(metrics, on="cell_id", how="left")
    df["geometry"] = df.apply(
        lambda row: cell_geometry(row, config.grid_cell_size_deg),
        axis=1,
    )

    df[["grid_id", "cell_id", "health_score", "geometry"]].to_csv(output_path, index=False)
    print(f"PostGIS file ready: {output_path}")
    print(f"Rows: {len(df):,}")


if __name__ == "__main__":
    main()
