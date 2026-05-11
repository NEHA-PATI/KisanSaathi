from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = PROJECT_ROOT / "data" / "processed" / "postgis_ready.csv"
METRICS_PATH = PROJECT_ROOT / "data" / "processed" / "db_ready.csv"
DATABASE_URL = "postgresql://postgres:Mikaelson@localhost:5432/BhoomiAI"

engine = create_engine(DATABASE_URL)

df = pd.read_csv(CSV_PATH)
metrics = pd.read_csv(
    METRICS_PATH,
    usecols=[
        "cell_id",
        "health_score",
        "ndvi_pred",
        "water_stress",
        "heat_stress",
        "irrigation_need_pct",
        "irrigation_needed",
        "risk_flag",
    ],
)
df = df.merge(metrics, on="cell_id", how="left", suffixes=("_grid", ""))
df["health_score"] = df["health_score"].fillna(df["health_score_grid"])

with engine.begin() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    conn.execute(text("DROP TABLE IF EXISTS temp_import"))

df.to_sql("temp_import", engine, if_exists="replace", index=False)

with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS agri_predictions"))
    conn.execute(
        text(
            """
            CREATE TABLE agri_predictions AS
            SELECT
                cell_id::integer AS cell_id,
                health_score::double precision AS health_score,
                ndvi_pred::double precision AS ndvi,
                water_stress::double precision AS water_stress,
                heat_stress::double precision AS heat_stress,
                irrigation_need_pct::double precision AS irrigation_need_pct,
                irrigation_needed::integer AS irrigation_needed,
                risk_flag::integer AS risk_flag,
                ST_SetSRID(ST_GeomFromGeoJSON(geometry), 4326) AS geom
            FROM temp_import
            """
        )
    )
    conn.execute(
        text(
            """
            CREATE INDEX agri_predictions_geom_gix
            ON agri_predictions
            USING GIST (geom)
            """
        )
    )
    conn.execute(
        text(
            """
            CREATE INDEX agri_predictions_cell_id_idx
            ON agri_predictions (cell_id)
            """
        )
    )

print(f"Data loaded into agri_predictions from {CSV_PATH}")
print(f"Rows: {len(df):,}")
