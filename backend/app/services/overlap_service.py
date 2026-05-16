from sqlalchemy import text
from app.db import engine


def compute_overlap(land_id):

    query = text("""

    DELETE FROM land_grid_overlap
    WHERE land_id = :land_id;

    INSERT INTO land_grid_overlap (
        land_id,
        grid_id,
        district_slug,
        cell_id,
        overlap_ratio,
        overlap_area_m2
    )

    SELECT

        fl.land_id,

        gc.grid_id,

        gc.district_slug,

        gc.cell_id,

        ST_Area(
            ST_Intersection(fl.geom, gc.geom)::geography
        )
        /
        NULLIF(ST_Area(gc.geom::geography), 0),

        ST_Area(
            ST_Intersection(fl.geom, gc.geom)::geography
        )

    FROM farmer_land fl

    JOIN prediction_grid_cells gc

    ON gc.district_slug = fl.district_slug
    AND ST_Intersects(fl.geom, gc.geom)

    WHERE fl.land_id = :land_id
    AND NOT ST_IsEmpty(ST_Intersection(fl.geom, gc.geom))

    ON CONFLICT (land_id, grid_id)
    DO UPDATE SET
        district_slug = EXCLUDED.district_slug,
        cell_id = EXCLUDED.cell_id,
        overlap_ratio = EXCLUDED.overlap_ratio,
        overlap_area_m2 = EXCLUDED.overlap_area_m2

    """)

    with engine.begin() as conn:

        conn.execute(query, {"land_id": land_id})
