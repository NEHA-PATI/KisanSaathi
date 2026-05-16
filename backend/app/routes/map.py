import json
import os
import time
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.db import engine
from ingestion.config import get_district_config, list_district_keys

try:
    import redis
except ImportError:
    redis = None


router = APIRouter()

MAP_CACHE_TTL_SECONDS = int(os.getenv("MAP_CACHE_TTL_SECONDS", "60"))
REDIS_URL = os.getenv("REDIS_URL")

PROJECT_ROOT = Path(__file__).resolve().parents[3]

ACTIVE_DISTRICT_CONFIG = get_district_config()

CSV_FALLBACK_PATH = ACTIVE_DISTRICT_CONFIG.processed_dir / "postgis_ready.csv"

METRICS_FALLBACK_PATH = ACTIVE_DISTRICT_CONFIG.processed_dir / "db_ready.csv"

redis_client = (
    redis.from_url(REDIS_URL, decode_responses=True) if redis and REDIS_URL else None
)

memory_cache = {}

csv_feature_cache = None


class AnalyzePolygonRequest(BaseModel):
    geometry: dict
    preview_image: str | None = None
    analysis: dict | None = None


FARMER_PROFILE_PATH = PROJECT_ROOT / "data" / "farmer_profiles" / "default_farmer.json"


@lru_cache(maxsize=1)
def get_prediction_columns():

    try:

        with engine.begin() as conn:

            result = conn.execute(text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'agri_predictions'
                    """))

            return {row[0] for row in result.fetchall()}

    except Exception:

        return set()


def metric_sql(column_name, fallback="NULL::double precision"):

    columns = get_prediction_columns()

    if column_name in columns:
        return column_name

    if column_name == "ndvi" and "ndvi_pred" in columns:
        return "ndvi_pred"

    if column_name == "soil_moisture" and "soil_moisture_pred" in columns:
        return "soil_moisture_pred"

    return fallback


def clamp(value, minimum=0, maximum=1):
    return max(minimum, min(maximum, float(value)))


def enrich_metrics(row):

    ndvi = row.get("ndvi")

    water_stress = row.get("water_stress")

    heat_stress = row.get("heat_stress")

    stored_health = row.get("health_score")

    ndvi_norm = clamp(((ndvi if ndvi is not None else 0.35) - 0.18) / 0.5)

    water_norm = clamp((float(water_stress or 0) - 3.2) / 5.8)

    heat_norm = clamp((float(heat_stress or 0) - 185) / 160)

    recalculated_health = (
        2.0 + 5.2 * ndvi_norm + 1.6 * (1 - water_norm) + 1.2 * (1 - heat_norm)
    )

    if stored_health is None or float(stored_health) <= 0.05:
        health_score = recalculated_health
    else:
        health_score = stored_health

    irrigation_need_pct = (
        clamp(
            (0.62 * water_norm + 0.24 * heat_norm + 0.14 * (1 - ndvi_norm)),
            0,
            1,
        )
        * 100
    )

    row["health_score"] = round(
        clamp(health_score, 0, 10),
        2,
    )

    row["irrigation_need_pct"] = round(
        irrigation_need_pct,
        1,
    )

    row["irrigation_needed"] = int(irrigation_need_pct >= 45)

    row["risk_flag"] = int(row["health_score"] < 4.2 or irrigation_need_pct >= 70)

    return row


@router.get("/district_boundaries")
def district_boundaries():
    features = []

    for slug in list_district_keys():
        config = get_district_config(slug)
        boundary_path = config.source_boundary_path

        if not boundary_path.exists():
            continue

        with boundary_path.open("r", encoding="utf-8") as boundary_file:
            payload = json.load(boundary_file)

        raw_features = []
        if payload.get("type") == "FeatureCollection":
            raw_features = payload.get("features", [])
        elif payload.get("type") == "Feature":
            raw_features = [payload]

        for feature in raw_features:
            properties = feature.get("properties") or {}
            properties["district_slug"] = slug
            properties["district_name"] = config.name
            feature["properties"] = properties
            features.append(feature)

    return {"type": "FeatureCollection", "features": features}


def bbox_cache_key(minx, miny, maxx, maxy):

    rounded = [round(value, 4) for value in (minx, miny, maxx, maxy)]

    return "map_bbox:" + ":".join(str(value) for value in rounded)


def get_cached_response(key):

    if redis_client:
        cached = redis_client.get(key)
        return json.loads(cached) if cached else None

    cached = memory_cache.get(key)

    if not cached:
        return None

    created_at, data = cached

    if time.time() - created_at > MAP_CACHE_TTL_SECONDS:
        memory_cache.pop(key, None)
        return None

    return data


def set_cached_response(key, data):

    if redis_client:
        redis_client.setex(
            key,
            MAP_CACHE_TTL_SECONDS,
            json.dumps(data),
        )
        return

    memory_cache[key] = (time.time(), data)


def get_csv_features():

    global csv_feature_cache

    if csv_feature_cache is not None:
        return csv_feature_cache

    import csv

    metrics_by_cell = {}

    if METRICS_FALLBACK_PATH.exists():

        with METRICS_FALLBACK_PATH.open(
            newline="",
            encoding="utf-8",
        ) as file:

            for row in csv.DictReader(file):

                metrics_by_cell[int(row["cell_id"])] = {
                    "ndvi": float(row["ndvi_pred"]),
                    "water_stress": float(row["water_stress"]),
                    "heat_stress": float(row["heat_stress"]),
                    "irrigation_needed": int(row["irrigation_needed"]),
                    "risk_flag": int(row["risk_flag"]),
                }

    features = []

    if not CSV_FALLBACK_PATH.exists():
        csv_feature_cache = features
        return features

    with CSV_FALLBACK_PATH.open(
        newline="",
        encoding="utf-8",
    ) as file:

        for row in csv.DictReader(file):

            geometry = json.loads(row["geometry"])

            coordinates = geometry["coordinates"][0]

            lons = [point[0] for point in coordinates]

            lats = [point[1] for point in coordinates]

            cell_id = int(row["cell_id"])

            features.append(
                enrich_metrics(
                    {
                        "cell_id": cell_id,
                        "health_score": float(row["health_score"]),
                        "geometry": geometry,
                        "bbox": (
                            min(lons),
                            min(lats),
                            max(lons),
                            max(lats),
                        ),
                        **metrics_by_cell.get(cell_id, {}),
                    }
                )
            )

    csv_feature_cache = features

    return features


def query_csv_bbox(minx, miny, maxx, maxy):

    rows = []

    for feature in get_csv_features():

        left, bottom, right, top = feature["bbox"]

        intersects = left <= maxx and right >= minx and bottom <= maxy and top >= miny

        if intersects:

            rows.append(
                enrich_metrics(
                    {
                        "cell_id": feature["cell_id"],
                        "health_score": feature["health_score"],
                        "geometry": feature["geometry"],
                        "ndvi": feature.get("ndvi"),
                        "water_stress": feature.get("water_stress"),
                        "heat_stress": feature.get("heat_stress"),
                        "irrigation_needed": feature.get("irrigation_needed"),
                        "risk_flag": feature.get("risk_flag"),
                    }
                )
            )

        if len(rows) >= 5000:
            break

    return rows


@router.get("/map_bbox")
def map_bbox(
    minx: float | None = Query(default=None),
    miny: float | None = Query(default=None),
    maxx: float | None = Query(default=None),
    maxy: float | None = Query(default=None),
    min_lon: float | None = Query(default=None),
    min_lat: float | None = Query(default=None),
    max_lon: float | None = Query(default=None),
    max_lat: float | None = Query(default=None),
):

    minx = minx if minx is not None else min_lon
    miny = miny if miny is not None else min_lat
    maxx = maxx if maxx is not None else max_lon
    maxy = maxy if maxy is not None else max_lat

    if None in (minx, miny, maxx, maxy):

        raise HTTPException(
            status_code=422,
            detail=(
                "Provide either "
                "minx/miny/maxx/maxy "
                "or "
                "min_lon/min_lat/max_lon/max_lat"
            ),
        )

    cache_key = bbox_cache_key(
        minx,
        miny,
        maxx,
        maxy,
    )

    cached = get_cached_response(cache_key)

    if cached is not None:
        return cached

    try:

        ndvi_sql = metric_sql("ndvi")
        moisture_sql = metric_sql("soil_moisture")
        water_sql = metric_sql("water_stress")
        heat_sql = metric_sql("heat_stress")
        irrigation_sql = metric_sql("irrigation_needed", "0")
        risk_sql = metric_sql("risk_flag", "0")

        with engine.begin() as conn:

            result = conn.execute(
                text(f"""
                    WITH latest AS (
                        SELECT district_slug, MAX(prediction_date) AS prediction_date
                        FROM agri_predictions
                        GROUP BY district_slug
                    )

                    SELECT
                        ag.grid_id,
                        ag.cell_id,
                        ag.health_score,
                        {ndvi_sql} AS ndvi,
                        {moisture_sql} AS soil_moisture,
                        {water_sql} AS water_stress,
                        {heat_sql} AS heat_stress,
                        {irrigation_sql} AS irrigation_needed,
                        {risk_sql} AS risk_flag,
                        ag.district_slug,
                        ST_AsGeoJSON(ag.geom)

                    FROM agri_predictions ag
                    JOIN latest
                        ON ag.prediction_date = latest.prediction_date
                        AND ag.district_slug = latest.district_slug

                    WHERE ag.geom && ST_MakeEnvelope(
                        :minx,
                        :miny,
                        :maxx,
                        :maxy,
                        4326
                    )

                    LIMIT 5000
                    """),
                {
                    "minx": minx,
                    "miny": miny,
                    "maxx": maxx,
                    "maxy": maxy,
                },
            )

            rows = result.fetchall()

            result_data = [
                enrich_metrics(
                    {
                        "grid_id": row[0],
                        "cell_id": row[1],
                        "health_score": row[2],
                        "ndvi": row[3],
                        "soil_moisture": row[4],
                        "water_stress": row[5],
                        "heat_stress": row[6],
                        "irrigation_needed": row[7],
                        "risk_flag": row[8],
                        "district_slug": row[9],
                        "geometry": row[10],
                    }
                )
                for row in rows
            ]

    except Exception as e:

        print("Database fallback triggered:", e)

        result_data = query_csv_bbox(
            minx,
            miny,
            maxx,
            maxy,
        )

    set_cached_response(cache_key, result_data)

    return result_data


@router.post("/analyze_polygon")
def analyze_polygon(payload: AnalyzePolygonRequest):

    try:

        ndvi_sql = metric_sql("ndvi")
        moisture_sql = metric_sql("soil_moisture")
        water_sql = metric_sql("water_stress")
        heat_sql = metric_sql("heat_stress")

        with engine.begin() as conn:

            result = conn.execute(
                text(f"""
                    WITH latest AS (
                        SELECT district_slug, MAX(prediction_date) AS prediction_date
                        FROM agri_predictions
                        GROUP BY district_slug
                    ),
                    selected_land AS (
                        SELECT ST_SetSRID(
                            ST_GeomFromGeoJSON(:geometry),
                            4326
                        ) AS geom
                    )

                    SELECT
                        COALESCE(
                            SUM(
                                ag.health_score
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS avg_health,
                        COUNT(*) AS cell_count,
                        COALESCE(
                            SUM(
                                {ndvi_sql}
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS avg_ndvi,
                        COALESCE(
                            SUM(
                                {moisture_sql}
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS avg_moisture,
                        COALESCE(
                            SUM(
                                {water_sql}
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS avg_water_stress,
                        COALESCE(
                            SUM(
                                {heat_sql}
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS avg_heat_stress,
                        COALESCE(
                            SUM(
                                ag.irrigation_need_pct
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS irrigation_need_pct,
                        COALESCE(
                            SUM(
                                ag.risk_flag
                                * ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)
                            )
                            / NULLIF(SUM(ST_Area(ST_Intersection(ag.geom, selected_land.geom)::geography)), 0),
                            0
                        ) AS risk_score

                    FROM agri_predictions ag
                    JOIN latest
                        ON ag.prediction_date = latest.prediction_date
                        AND ag.district_slug = latest.district_slug
                    CROSS JOIN selected_land

                    WHERE ST_Intersects(
                        ag.geom,
                        selected_land.geom
                    )
                    """),
                {
                    "geometry": json.dumps(payload.geometry),
                },
            )

            (
                avg_health,
                cell_count,
                avg_ndvi,
                avg_moisture,
                avg_water_stress,
                avg_heat_stress,
                irrigation_need_pct,
                risk_score,
            ) = result.fetchone()

    except Exception as e:

        print("Polygon analysis fallback:", e)

        return analyze_polygon_csv(payload.geometry)

    return analysis_response(
        avg_health,
        cell_count,
        irrigation_need_pct,
        avg_ndvi,
        avg_moisture,
        avg_water_stress,
        avg_heat_stress,
        risk_score,
    )


def analyze_polygon_csv(geometry):

    coordinates = geometry["coordinates"][0]

    lons = [point[0] for point in coordinates]

    lats = [point[1] for point in coordinates]

    minx = min(lons)
    miny = min(lats)
    maxx = max(lons)
    maxy = max(lats)

    rows = query_csv_bbox(minx, miny, maxx, maxy)

    scores = [row["health_score"] for row in rows]

    irrigation = [row.get("irrigation_need_pct", 0) for row in rows]

    avg_health = sum(scores) / len(scores) if scores else 0

    avg_irrigation = sum(irrigation) / len(irrigation) if irrigation else 0

    return analysis_response(
        avg_health,
        len(rows),
        avg_irrigation,
    )


def analysis_response(
    avg_health,
    cell_count,
    irrigation_need_pct=0,
    avg_ndvi=0,
    avg_moisture=0,
    avg_water_stress=0,
    avg_heat_stress=0,
    risk_score=0,
):

    avg_health = float(avg_health or 0)

    irrigation_need_pct = float(irrigation_need_pct or 0)
    avg_ndvi = float(avg_ndvi or 0)
    avg_moisture = float(avg_moisture or 0)
    avg_water_stress = float(avg_water_stress or 0)
    avg_heat_stress = float(avg_heat_stress or 0)
    risk_score = float(risk_score or 0)

    if avg_health < 4 or irrigation_need_pct >= 70:

        risk = "High"

        advice = (
            f"Irrigation demand is "
            f"{irrigation_need_pct:.0f}%. "
            f"Prioritize this field and inspect "
            f"heat-water stress before the next cycle."
        )

    elif avg_health < 7 or irrigation_need_pct >= 45:

        risk = "Moderate"

        advice = (
            f"Irrigation demand is "
            f"{irrigation_need_pct:.0f}%. "
            f"Keep irrigation ready and monitor "
            f"stress signals across the selected land."
        )

    else:

        risk = "Low"

        advice = (
            f"Irrigation demand is "
            f"{irrigation_need_pct:.0f}%. "
            f"Crop health is stable; continue "
            f"regular monitoring."
        )

    trend = [
        max(0, min(10, avg_health - 0.7)),
        max(0, min(10, avg_health - 0.2)),
        max(0, min(10, avg_health)),
        max(0, min(10, avg_health + 0.25)),
    ]

    return {
        "avg_health": avg_health,
        "health": avg_health,
        "avg_ndvi": avg_ndvi,
        "crop_greenness": avg_ndvi,
        "avg_moisture": avg_moisture,
        "soil_wetness": avg_moisture,
        "avg_water_stress": avg_water_stress,
        "water_stress": avg_water_stress,
        "avg_heat_stress": avg_heat_stress,
        "heat_stress": avg_heat_stress,
        "cell_count": cell_count,
        "risk": risk,
        "risk_score": risk_score,
        "risk_label": risk,
        "irrigation_need_pct": round(
            irrigation_need_pct,
            1,
        ),
        "water_need": round(irrigation_need_pct, 1),
        "irrigation_advice": advice,
        "trend": trend,
    }


@router.get("/farmer_profile")
def farmer_profile():

    if FARMER_PROFILE_PATH.exists():

        return json.loads(FARMER_PROFILE_PATH.read_text(encoding="utf-8"))

    return {
        "farmer_id": "default_farmer",
        "name": "Sambalpur Farmer",
        "saved_lands": [],
    }


@router.post("/farmer_land")
def save_farmer_land(payload: AnalyzePolygonRequest):

    profile = farmer_profile()

    land = {
        "id": f"land_{int(time.time())}",
        "saved_at": int(time.time()),
        "geometry": payload.geometry,
        "preview_image": payload.preview_image,
        "analysis": (payload.analysis or analyze_polygon_csv(payload.geometry)),
    }

    profile["saved_lands"] = [
        land,
        *profile.get("saved_lands", [])[:4],
    ]

    FARMER_PROFILE_PATH.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    FARMER_PROFILE_PATH.write_text(
        json.dumps(profile, indent=2),
        encoding="utf-8",
    )

    return profile
