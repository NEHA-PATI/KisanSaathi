import argparse
import json
import os
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db import engine
from ingestion.config import get_district_config, materialize_boundary
from schema_utils import apply_schema_file, global_grid_id


def apply_schema():
    if os.getenv("SKIP_SCHEMA") == "1":
        return
    apply_schema_file(engine, BACKEND_ROOT / "db" / "schema.sql")


def geojson_geometry(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    data_type = data.get("type")
    if data_type in {"Polygon", "MultiPolygon"}:
        return data
    if data_type == "Feature":
        return data["geometry"]
    if data_type == "FeatureCollection":
        geometries = [
            feature["geometry"]
            for feature in data.get("features", [])
            if feature.get("geometry")
        ]
        if len(geometries) == 1:
            return geometries[0]
        return {"type": "GeometryCollection", "geometries": geometries}
    raise ValueError(f"Unsupported GeoJSON type in {path}: {data_type}")


def main():
    parser = argparse.ArgumentParser(description="Load a district boundary and grid into PostGIS.")
    parser.add_argument("--district", help="District key from district_config.json")
    args = parser.parse_args()

    config = get_district_config(args.district)
    boundary_path = materialize_boundary(config)
    grid = pd.read_csv(config.grid_path)
    grid["district_slug"] = config.slug
    grid["grid_cell_size_deg"] = config.grid_cell_size_deg
    if "grid_id" not in grid.columns:
        grid["grid_id"] = grid.apply(
            lambda row: global_grid_id(
                row["lat"],
                row["lon"],
                config.grid_cell_size_deg,
            ),
            axis=1,
        )

    boundary = geojson_geometry(boundary_path)

    apply_schema()

    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS temp_grid_import"))

    grid.to_sql("temp_grid_import", engine, if_exists="replace", index=False)

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO district_boundaries (
                    district_slug,
                    district_name,
                    boundary_source,
                    geom,
                    loaded_at
                )
                VALUES (
                    :district_slug,
                    :district_name,
                    :boundary_source,
                    ST_Multi(
                        ST_CollectionExtract(
                            ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326),
                            3
                        )
                    ),
                    now()
                )
                ON CONFLICT (district_slug)
                DO UPDATE SET
                    district_name = EXCLUDED.district_name,
                    boundary_source = EXCLUDED.boundary_source,
                    geom = EXCLUDED.geom,
                    loaded_at = now()
                """
            ),
            {
                "district_slug": config.slug,
                "district_name": config.name,
                "boundary_source": str(config.source_boundary_path),
                "geometry": json.dumps(boundary),
            },
        )

        conn.execute(
            text(
                """
                INSERT INTO prediction_grid_cells (
                    grid_id,
                    district_slug,
                    cell_id,
                    lat,
                    lon,
                    grid_cell_size_deg,
                    geom,
                    centroid,
                    created_at
                )
                SELECT
                    grid_id::text,
                    district_slug::text,
                    cell_id::integer,
                    lat::double precision,
                    lon::double precision,
                    grid_cell_size_deg::double precision,
                    ST_SetSRID(
                        ST_MakePolygon(
                            ST_MakeLine(ARRAY[
                                ST_MakePoint(lon, lat),
                                ST_MakePoint(lon + grid_cell_size_deg, lat),
                                ST_MakePoint(lon + grid_cell_size_deg, lat + grid_cell_size_deg),
                                ST_MakePoint(lon, lat + grid_cell_size_deg),
                                ST_MakePoint(lon, lat)
                            ])
                        ),
                        4326
                    ),
                    ST_SetSRID(
                        ST_MakePoint(
                            lon + grid_cell_size_deg / 2.0,
                            lat + grid_cell_size_deg / 2.0
                        ),
                        4326
                    ),
                    now()
                FROM temp_grid_import
                ON CONFLICT (district_slug, cell_id)
                DO UPDATE SET
                    grid_id = EXCLUDED.grid_id,
                    lat = EXCLUDED.lat,
                    lon = EXCLUDED.lon,
                    grid_cell_size_deg = EXCLUDED.grid_cell_size_deg,
                    geom = EXCLUDED.geom,
                    centroid = EXCLUDED.centroid
                """
            )
        )
        conn.execute(text("DROP TABLE IF EXISTS temp_grid_import"))

    print(f"Loaded grid into prediction_grid_cells: {config.slug}")
    print(f"Rows: {len(grid):,}")


if __name__ == "__main__":
    main()
