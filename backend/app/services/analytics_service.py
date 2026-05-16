import json

from sqlalchemy import text

from app.db import engine


def generate_land_snapshot(land_id, snapshot_date):
    query = text(
        """
        INSERT INTO land_snapshots (
            land_id,
            snapshot_date,
            avg_health,
            avg_ndvi,
            avg_moisture,
            avg_water_stress,
            avg_heat_stress,
            irrigation_need,
            risk_score,
            covered_area_m2,
            cell_count,
            updated_at
        )
        SELECT
            :land_id,
            :snapshot_date,
            SUM(ag.health_score * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(ag.ndvi * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(ag.soil_moisture * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(ag.water_stress * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(ag.heat_stress * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(ag.irrigation_need_pct * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(ag.risk_flag * lgo.overlap_area_m2) / NULLIF(SUM(lgo.overlap_area_m2), 0),
            SUM(lgo.overlap_area_m2),
            COUNT(*),
            now()
        FROM land_grid_overlap lgo
        JOIN farmer_land fl
            ON fl.land_id = lgo.land_id
        JOIN agri_predictions ag
            ON ag.grid_id = lgo.grid_id
            AND ag.prediction_date = :snapshot_date
        WHERE lgo.land_id = :land_id
        GROUP BY fl.land_id
        ON CONFLICT (land_id, snapshot_date)
        DO UPDATE SET
            avg_health = EXCLUDED.avg_health,
            avg_ndvi = EXCLUDED.avg_ndvi,
            avg_moisture = EXCLUDED.avg_moisture,
            avg_water_stress = EXCLUDED.avg_water_stress,
            avg_heat_stress = EXCLUDED.avg_heat_stress,
            irrigation_need = EXCLUDED.irrigation_need,
            risk_score = EXCLUDED.risk_score,
            covered_area_m2 = EXCLUDED.covered_area_m2,
            cell_count = EXCLUDED.cell_count,
            updated_at = now()
        RETURNING
            snapshot_id,
            land_id,
            snapshot_date,
            avg_health,
            avg_ndvi,
            avg_moisture,
            avg_water_stress,
            avg_heat_stress,
            irrigation_need,
            risk_score,
            covered_area_m2,
            cell_count
        """
    )

    with engine.begin() as conn:
        row = conn.execute(
            query,
            {
                "land_id": land_id,
                "snapshot_date": snapshot_date,
            },
        ).mappings().fetchone()

    if row is None:
        return None

    return snapshot_row(row)


def latest_prediction_date_for_land(land_id):
    query = text(
        """
        SELECT MAX(ag.prediction_date)
        FROM land_grid_overlap lgo
        JOIN agri_predictions ag
            ON ag.grid_id = lgo.grid_id
        WHERE lgo.land_id = :land_id
        """
    )

    with engine.begin() as conn:
        return conn.execute(query, {"land_id": land_id}).scalar()


def generate_latest_land_snapshot(land_id):
    latest_date = latest_prediction_date_for_land(land_id)
    if latest_date is None:
        return None
    return generate_land_snapshot(land_id, latest_date)


def generate_all_land_snapshots(land_id, start_date=None, end_date=None):
    date_query = """
        SELECT DISTINCT ag.prediction_date
        FROM land_grid_overlap lgo
        JOIN agri_predictions ag
            ON ag.grid_id = lgo.grid_id
        WHERE lgo.land_id = :land_id
    """
    params = {"land_id": land_id}
    if start_date:
        date_query += " AND ag.prediction_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        date_query += " AND ag.prediction_date <= :end_date"
        params["end_date"] = end_date
    date_query += " ORDER BY ag.prediction_date"

    with engine.begin() as conn:
        dates = [
            row[0]
            for row in conn.execute(text(date_query), params).fetchall()
        ]

    snapshots = []
    for prediction_date in dates:
        snapshot = generate_land_snapshot(land_id, prediction_date)
        if snapshot:
            snapshots.append(snapshot)

    return snapshots


def get_land_detail(land_id):
    row = fetch_land_detail_row(land_id)

    if row is None:
        return None

    if row["snapshot_date"] is None:
        generate_latest_land_snapshot(land_id)
        row = fetch_land_detail_row(land_id)
        if row is None:
            return None

    return {
        "land_id": row["land_id"],
        "farmer_id": row["farmer_id"],
        "land_name": row["land_name"],
        "district_slug": row["district_slug"],
        "area_hectares": row["area_hectares"],
        "geometry": json.loads(row["geometry"]),
        "latest_snapshot": snapshot_row(row) if row["snapshot_date"] else None,
    }


def fetch_land_detail_row(land_id):
    query = text(
        """
        SELECT
            fl.land_id,
            fl.farmer_id,
            fl.land_name,
            fl.district_slug,
            fl.area_hectares,
            ST_AsGeoJSON(fl.geom) AS geometry,
            ls.snapshot_date,
            ls.avg_health,
            ls.avg_ndvi,
            ls.avg_moisture,
            ls.avg_water_stress,
            ls.avg_heat_stress,
            ls.irrigation_need,
            ls.risk_score,
            ls.cell_count
        FROM farmer_land fl
        LEFT JOIN LATERAL (
            SELECT *
            FROM land_snapshots
            WHERE land_id = fl.land_id
            ORDER BY snapshot_date DESC
            LIMIT 1
        ) ls ON true
        WHERE fl.land_id = :land_id
        """
    )

    with engine.begin() as conn:
        return conn.execute(query, {"land_id": land_id}).mappings().fetchone()


def get_land_trends(land_id):
    query = text(
        """
        SELECT
            snapshot_date,
            avg_health,
            avg_ndvi,
            avg_moisture,
            avg_water_stress,
            avg_heat_stress,
            irrigation_need,
            risk_score,
            cell_count
        FROM land_snapshots
        WHERE land_id = :land_id
        ORDER BY snapshot_date
        """
    )

    with engine.begin() as conn:
        rows = conn.execute(query, {"land_id": land_id}).mappings().fetchall()

    return [snapshot_row(row) for row in rows]


def get_land_overlaps(land_id, snapshot_date=None):
    params = {"land_id": land_id}
    date_filter = """
        AND ag.prediction_date = COALESCE(
            CAST(:snapshot_date AS date),
            (
                SELECT MAX(prediction_date)
                FROM agri_predictions
                WHERE district_slug = lgo.district_slug
            )
        )
    """
    params["snapshot_date"] = snapshot_date

    query = text(
        f"""
        SELECT
            lgo.cell_id,
            lgo.grid_id,
            lgo.overlap_ratio,
            lgo.overlap_area_m2,
            ag.prediction_date,
            ag.health_score,
            ag.ndvi,
            ag.soil_moisture,
            ag.water_stress,
            ag.heat_stress,
            ag.irrigation_need_pct,
            ag.risk_flag,
            ST_AsGeoJSON(gc.geom) AS geometry,
            ST_Y(gc.centroid) AS centroid_lat,
            ST_X(gc.centroid) AS centroid_lon,
            ST_AsGeoJSON(ST_Intersection(fl.geom, gc.geom)) AS covered_geometry
        FROM land_grid_overlap lgo
        JOIN farmer_land fl
            ON fl.land_id = lgo.land_id
        JOIN prediction_grid_cells gc
            ON gc.grid_id = lgo.grid_id
        LEFT JOIN agri_predictions ag
            ON ag.grid_id = lgo.grid_id
            {date_filter}
        WHERE lgo.land_id = :land_id
        ORDER BY lgo.overlap_ratio DESC, lgo.cell_id
        """
    )

    with engine.begin() as conn:
        rows = conn.execute(query, params).mappings().fetchall()

    return [
        {
            "cell_id": row["cell_id"],
            "grid_id": row["grid_id"],
            "coverage_pct": round(float(row["overlap_ratio"] or 0) * 100, 2),
            "overlap_area_m2": row["overlap_area_m2"],
            "date": str(row["prediction_date"]) if row["prediction_date"] else None,
            "health_score": row["health_score"],
            "crop_greenness": row["ndvi"],
            "soil_wetness": row["soil_moisture"],
            "water_need": row["irrigation_need_pct"],
            "water_stress": row["water_stress"],
            "heat_stress": row["heat_stress"],
            "risk_score": row["risk_flag"],
            "centroid": {
                "lat": row["centroid_lat"],
                "lon": row["centroid_lon"],
            },
            "geometry": json.loads(row["geometry"]) if row["geometry"] else None,
            "covered_geometry": (
                json.loads(row["covered_geometry"]) if row["covered_geometry"] else None
            ),
        }
        for row in rows
    ]


def snapshot_row(row):
    risk_score = row["risk_score"]
    irrigation_need = row["irrigation_need"]
    return {
        "snapshot_id": row.get("snapshot_id"),
        "land_id": row.get("land_id"),
        "date": str(row["snapshot_date"]),
        "health": row["avg_health"],
        "crop_greenness": row["avg_ndvi"],
        "soil_wetness": row["avg_moisture"],
        "water_stress": row["avg_water_stress"],
        "heat_stress": row["avg_heat_stress"],
        "water_need": irrigation_need,
        "risk": risk_score,
        "risk_label": risk_label(row["avg_health"], irrigation_need, risk_score),
        "covered_area_m2": row.get("covered_area_m2"),
        "cell_count": row.get("cell_count"),
    }


def risk_label(health, irrigation_need, risk_score):
    if (risk_score or 0) >= 0.5 or (health or 0) < 4.2 or (irrigation_need or 0) >= 70:
        return "High"
    if (health or 0) < 7 or (irrigation_need or 0) >= 45:
        return "Moderate"
    return "Low"
