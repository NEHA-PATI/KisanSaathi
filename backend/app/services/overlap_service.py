from sqlalchemy import text
from app.db import engine


def compute_overlap(land_id):

    query = text("""

    INSERT INTO land_grid_overlap

    SELECT

        fl.land_id,

        ag.cell_id,

        ST_Area(
            ST_Intersection(fl.geom, ag.geom)
        )
        /
        ST_Area(ag.geom)

    FROM farmer_land fl

    JOIN agri_predictions ag

    ON ST_Intersects(fl.geom, ag.geom)

    WHERE fl.land_id = :land_id

    """)

    with engine.begin() as conn:

        conn.execute(query, {"land_id": land_id})
