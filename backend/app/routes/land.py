import json
from datetime import date, datetime

from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

from app.schemas.land_schema import LandCreate
from app.services.overlap_service import compute_overlap
from app.services.analytics_service import generate_latest_land_snapshot
from ingestion.config import get_district_config

router = APIRouter()


def resolve_district_slug(conn, geometry):
    fallback_slug = get_district_config().slug

    table_exists = conn.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'district_boundaries'
            )
            """
        )
    ).scalar()

    if not table_exists:
        return fallback_slug

    district_slug = conn.execute(
        text(
            """
            WITH selected_land AS (
                SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326) AS geom
            )
            SELECT db.district_slug
            FROM district_boundaries db
            CROSS JOIN selected_land
            WHERE ST_Intersects(db.geom, selected_land.geom)
            ORDER BY ST_Area(ST_Intersection(db.geom, selected_land.geom)::geography) DESC
            LIMIT 1
            """
        ),
        {"geometry": geometry},
    ).scalar()

    return district_slug or fallback_slug


def fallback_value(column):
    data_type = column["data_type"]
    column_name = column["column_name"]

    if data_type in {"integer", "bigint", "smallint"}:
        return 0
    if data_type in {"double precision", "real", "numeric"}:
        return 0
    if data_type == "boolean":
        return False
    if data_type == "date":
        return date.today()
    if data_type.startswith("timestamp"):
        return datetime.utcnow()
    if data_type in {"json", "jsonb"}:
        return {}
    if "email" in column_name:
        return f"farmer{column['farmer_id']}@bhoomiai.local"
    if "phone" in column_name or "mobile" in column_name:
        return "0000000000"
    if "name" in column_name:
        return "Demo Farmer"
    return "demo"


def ensure_farmer(conn, farmer_id):
    table_exists = conn.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'farmers'
            )
            """
        )
    ).scalar()

    if not table_exists:
        return

    farmer_exists = conn.execute(
        text("SELECT EXISTS (SELECT 1 FROM farmers WHERE farmer_id = :farmer_id)"),
        {"farmer_id": farmer_id},
    ).scalar()

    if farmer_exists:
        return

    columns = conn.execute(
        text(
            """
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default,
                is_identity,
                generation_expression
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'farmers'
            ORDER BY ordinal_position
            """
        )
    ).mappings().fetchall()

    insert_columns = []
    params = {"farmer_id": farmer_id}

    for column in columns:
        column_name = column["column_name"]
        if column["is_identity"] == "YES" or column["generation_expression"]:
            continue
        if column_name == "farmer_id":
            insert_columns.append(column_name)
            continue
        needs_value = column["is_nullable"] == "NO" and column["column_default"] is None
        if needs_value:
            insert_columns.append(column_name)
            params[column_name] = fallback_value({**column, "farmer_id": farmer_id})

    if "farmer_id" not in insert_columns:
        insert_columns.insert(0, "farmer_id")

    values = [f":{column}" for column in insert_columns]
    conn.execute(
        text(
            f"""
            INSERT INTO farmers ({", ".join(insert_columns)})
            VALUES ({", ".join(values)})
            """
        ),
        params,
    )


@router.post("/lands")
def create_land(payload: LandCreate):
    geometry = json.dumps(payload.geometry)

    query = text("""

    INSERT INTO farmer_land (

        farmer_id,
        land_name,
        district_slug,
        geom,
        area_hectares

    )

    VALUES (

        :farmer_id,

        :land_name,

        :district_slug,

        ST_SetSRID(
            ST_GeomFromGeoJSON(:geometry),
            4326
        ),

        ST_Area(
            ST_SetSRID(
                ST_GeomFromGeoJSON(:geometry),
                4326
            )::geography
        ) / 10000.0

    )

    RETURNING land_id

    """)

    with engine.begin() as conn:
        ensure_farmer(conn, payload.farmer_id)
        district_slug = resolve_district_slug(conn, geometry)

        result = conn.execute(
            query,
            {
                "farmer_id": payload.farmer_id,
                "land_name": payload.land_name,
                "district_slug": district_slug,
                "geometry": geometry,
            },
        )

        land_id = result.fetchone()[0]

    compute_overlap(land_id)
    latest_snapshot = generate_latest_land_snapshot(land_id)

    return {
        "message": "Land created",
        "land_id": land_id,
        "district_slug": district_slug,
        "latest_snapshot": latest_snapshot,
    }
