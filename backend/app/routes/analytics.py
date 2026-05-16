from fastapi import APIRouter, HTTPException, Query

from app.services.analytics_service import (
    generate_all_land_snapshots,
    generate_land_snapshot,
    get_land_detail,
    get_land_overlaps,
)
from app.services.overlap_service import compute_overlap


router = APIRouter()


@router.get("/lands/{land_id}")
def land_detail(land_id: int):
    land = get_land_detail(land_id)
    if land is None:
        raise HTTPException(status_code=404, detail="Land not found")
    return land


@router.post("/lands/{land_id}/snapshot")
def create_snapshot(
    land_id: int,
    snapshot_date: str = Query(..., description="Prediction date in YYYY-MM-DD format."),
):
    snapshot = generate_land_snapshot(land_id, snapshot_date)
    if snapshot is None:
        raise HTTPException(
            status_code=404,
            detail="No overlapping prediction cells found for this land and date.",
        )
    return {"message": "Snapshot created", "snapshot": snapshot}


@router.post("/lands/{land_id}/snapshots/backfill")
def backfill_snapshots(
    land_id: int,
    start_date: str | None = None,
    end_date: str | None = None,
):
    snapshots = generate_all_land_snapshots(land_id, start_date, end_date)
    return {
        "message": "Snapshots generated",
        "count": len(snapshots),
        "snapshots": snapshots,
    }


@router.get("/lands/{land_id}/overlaps")
def land_overlaps(
    land_id: int,
    snapshot_date: str | None = None,
):
    overlaps = get_land_overlaps(land_id, snapshot_date)
    if not overlaps:
        compute_overlap(land_id)
        overlaps = get_land_overlaps(land_id, snapshot_date)
    return overlaps
