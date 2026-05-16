import argparse
import json
import sys
from pathlib import Path

import pandas as pd

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import SOURCES, ensure_district_dirs, get_district_config
from scripts.schema_utils import global_grid_id


def bottom_left_from_geojson(value):
    geometry = json.loads(value)
    ring = geometry["coordinates"][0]
    lons = [point[0] for point in ring]
    lats = [point[1] for point in ring]
    return min(lats), min(lons)


def add_grid_id_from_geometry(df, grid_cell_size_deg):
    if ".geo" not in df.columns:
        raise ValueError("Raw export is missing .geo geometry column; cannot remap state cell_id.")

    coords = df[".geo"].apply(bottom_left_from_geojson)
    df["export_lat"] = coords.apply(lambda pair: pair[0])
    df["export_lon"] = coords.apply(lambda pair: pair[1])
    df["grid_id"] = df.apply(
        lambda row: global_grid_id(
            row["export_lat"],
            row["export_lon"],
            grid_cell_size_deg,
        ),
        axis=1,
    )
    return df


def district_grid_lookup(config):
    grid = pd.read_csv(config.grid_path)
    if "grid_id" not in grid.columns:
        grid["grid_id"] = grid.apply(
            lambda row: global_grid_id(
                row["lat"],
                row["lon"],
                config.grid_cell_size_deg,
            ),
            axis=1,
        )
    return grid[["grid_id", "cell_id", "lat", "lon"]].rename(
        columns={
            "cell_id": "district_cell_id",
            "lat": "district_lat",
            "lon": "district_lon",
        }
    )


def remap_file(source_path, output_path, lookup, grid_cell_size_deg):
    df = pd.read_csv(source_path)
    original_rows = len(df)
    if "cell_id" in df.columns:
        df = df.rename(columns={"cell_id": "source_cell_id"})

    df = add_grid_id_from_geometry(df, grid_cell_size_deg)
    df = df.merge(lookup, on="grid_id", how="inner")

    df["cell_id"] = df["district_cell_id"].astype("int64")
    df = df.drop(
        columns=[
            "district_cell_id",
            "district_lat",
            "district_lon",
            "export_lat",
            "export_lon",
        ],
        errors="ignore",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)

    print(
        f"{source_path.name}: {original_rows:,} -> {len(df):,} rows "
        f"({output_path})"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Copy legacy state-level raw exports into a district folder with local cell_id and grid_id."
    )
    parser.add_argument("--district", required=True, help="District key from district_config.json")
    parser.add_argument(
        "--legacy-raw-dir",
        default=str(PROJECT_ROOT / "data" / "raw"),
        help="Existing raw export root containing source subfolders.",
    )
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=SOURCES,
        default=list(SOURCES),
        help="Sources to remap.",
    )
    args = parser.parse_args()

    config = get_district_config(args.district)
    ensure_district_dirs(config)
    lookup = district_grid_lookup(config)
    legacy_raw_dir = Path(args.legacy_raw_dir)

    for source in args.sources:
        source_dir = legacy_raw_dir / source
        output_dir = config.raw_source_dir(source)
        files = sorted(source_dir.glob("*.csv"))
        if not files:
            print(f"No CSV files found for {source}: {source_dir}")
            continue

        print(f"\nRemapping {source}: {len(files):,} files")
        for source_path in files:
            remap_file(
                source_path,
                output_dir / source_path.name,
                lookup,
                config.grid_cell_size_deg,
            )

    print("\nRaw exports remapped.")


if __name__ == "__main__":
    main()
