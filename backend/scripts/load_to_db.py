import argparse
import sys
from pathlib import Path

import json

import pandas as pd
from sqlalchemy import text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db import engine
from ingestion.config import get_district_config
from schema_utils import apply_schema_file, global_grid_id


def apply_schema():
    apply_schema_file(engine, BACKEND_ROOT / "db" / "schema.sql")


def main():
    parser = argparse.ArgumentParser(description="Load district predictions into PostGIS.")
    parser.add_argument("--district", help="District key from district_config.json")
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append this district instead of replacing agri_predictions.",
    )
    args = parser.parse_args()

    config = get_district_config(args.district)
    metrics_path = config.processed_dir / "db_ready.csv"

    metrics = pd.read_csv(metrics_path)
    required_columns = [
        "cell_id",
        "date",
        "health_score",
        "ndvi_pred",
        "soil_moisture_pred",
        "water_stress",
        "heat_stress",
        "irrigation_need_pct",
        "irrigation_needed",
        "risk_flag",
        "lat",
        "lon",
    ]
    missing = sorted(set(required_columns) - set(metrics.columns))
    if missing:
        raise ValueError(f"{metrics_path} is missing required columns: {missing}")
    keep_columns = required_columns + (["grid_id"] if "grid_id" in metrics.columns else [])
    metrics = metrics[keep_columns]
    metrics["district_slug"] = config.slug
    metrics["grid_cell_size_deg"] = config.grid_cell_size_deg
    if "grid_id" not in metrics.columns:
        metrics["grid_id"] = metrics.apply(
            lambda row: global_grid_id(
                row["lat"],
                row["lon"],
                config.grid_cell_size_deg,
            ),
            axis=1,
        )
    metrics["geometry"] = metrics.apply(
        lambda row: json.dumps(
            {
                "type": "Polygon",
                "coordinates": [
                    [
                        [float(row["lon"]), float(row["lat"])],
                        [
                            float(row["lon"]) + config.grid_cell_size_deg,
                            float(row["lat"]),
                        ],
                        [
                            float(row["lon"]) + config.grid_cell_size_deg,
                            float(row["lat"]) + config.grid_cell_size_deg,
                        ],
                        [
                            float(row["lon"]),
                            float(row["lat"]) + config.grid_cell_size_deg,
                        ],
                        [float(row["lon"]), float(row["lat"])],
                    ]
                ],
            }
        ),
        axis=1,
    )

    apply_schema()

    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS temp_import"))

    metrics.to_sql("temp_import", engine, if_exists="replace", index=False)

    with engine.begin() as conn:
        if not args.append:
            conn.execute(text("DROP TABLE IF EXISTS agri_predictions"))

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS agri_predictions (
                    grid_id text NOT NULL,
                    district_slug text,
                    cell_id integer,
                    prediction_date date,
                    health_score double precision,
                    ndvi double precision,
                    soil_moisture double precision,
                    water_stress double precision,
                    heat_stress double precision,
                    irrigation_need_pct double precision,
                    irrigation_needed integer,
                    risk_flag integer,
                    geom geometry(Polygon, 4326),
                    created_at timestamp DEFAULT now(),
                    PRIMARY KEY (district_slug, cell_id, prediction_date)
                )
                """
            )
        )

        if args.append:
            conn.execute(
                text("DELETE FROM agri_predictions WHERE district_slug = :district_slug"),
                {"district_slug": config.slug},
            )

        conn.execute(
            text(
                """
                INSERT INTO agri_predictions (
                    grid_id,
                    district_slug,
                    cell_id,
                    prediction_date,
                    health_score,
                    ndvi,
                    soil_moisture,
                    water_stress,
                    heat_stress,
                    irrigation_need_pct,
                    irrigation_needed,
                    risk_flag,
                    geom
                )
                SELECT
                    grid_id::text,
                    district_slug::text,
                    cell_id::integer,
                    date::date,
                    health_score::double precision,
                    ndvi_pred::double precision,
                    soil_moisture_pred::double precision,
                    water_stress::double precision,
                    heat_stress::double precision,
                    irrigation_need_pct::double precision,
                    irrigation_needed::integer,
                    risk_flag::integer,
                    ST_SetSRID(ST_GeomFromGeoJSON(geometry), 4326)
                FROM temp_import
                ON CONFLICT (district_slug, cell_id, prediction_date)
                DO UPDATE SET
                    health_score = EXCLUDED.health_score,
                    ndvi = EXCLUDED.ndvi,
                    soil_moisture = EXCLUDED.soil_moisture,
                    water_stress = EXCLUDED.water_stress,
                    heat_stress = EXCLUDED.heat_stress,
                    irrigation_need_pct = EXCLUDED.irrigation_need_pct,
                    irrigation_needed = EXCLUDED.irrigation_needed,
                    risk_flag = EXCLUDED.risk_flag,
                    geom = EXCLUDED.geom
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS agri_predictions_grid_date_idx
                ON agri_predictions (grid_id, prediction_date)
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS agri_predictions_geom_gix
                ON agri_predictions
                USING GIST (geom)
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS agri_predictions_cell_id_idx
                ON agri_predictions (cell_id)
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS agri_predictions_district_idx
                ON agri_predictions (district_slug)
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS agri_predictions_district_date_idx
                ON agri_predictions (district_slug, prediction_date)
                """
            )
        )
        conn.execute(text("DROP TABLE IF EXISTS temp_import"))

    print(f"Data loaded into agri_predictions from {metrics_path}")
    print(f"District: {config.slug}")
    print(f"Rows: {len(metrics):,}")


if __name__ == "__main__":
    main()
