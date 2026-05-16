from fastapi import APIRouter

from app.services.analytics_service import get_land_trends


router = APIRouter()


@router.get("/lands/{land_id}/trends")
def land_trends(land_id: int):
    return get_land_trends(land_id)
