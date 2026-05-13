from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

from app.schemas.land_schema import LandCreate
from app.services.overlap_service import compute_overlap

router = APIRouter()


@router.post("/lands")
def create_land(payload: LandCreate):

    query = text("""

    INSERT INTO farmer_land (

        farmer_id,
        land_name,
        geom,
        area_hectares

    )

    VALUES (

        :farmer_id,

        :land_name,

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

        result = conn.execute(
            query,
            {
                "farmer_id": payload.farmer_id,
                "land_name": payload.land_name,
                "geometry": str(payload.geometry),
            },
        )

        land_id = result.fetchone()[0]

    compute_overlap(land_id)

    return {"message": "Land created", "land_id": land_id}
