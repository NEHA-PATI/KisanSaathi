import argparse
import csv
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import get_district_config, materialize_boundary
from scripts.schema_utils import global_grid_id


def iter_polygon_rings(geometry):
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates", [])

    if geom_type == "Polygon":
        yield coordinates
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            yield polygon


def load_boundary_polygons(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    features = data.get("features", [{"geometry": data}])

    polygons = []
    for feature in features:
        geometry = feature.get("geometry") or feature
        polygons.extend(iter_polygon_rings(geometry))

    if not polygons:
        raise ValueError(f"No Polygon or MultiPolygon geometry found in {path}")

    return polygons


def bounds_for_polygons(polygons):
    points = [point for polygon in polygons for ring in polygon for point in ring]
    lons = [point[0] for point in points]
    lats = [point[1] for point in points]
    return min(lons), min(lats), max(lons), max(lats)


def point_in_ring(lon, lat, ring):
    inside = False
    j = len(ring) - 1
    for i, point in enumerate(ring):
        xi, yi = point[0], point[1]
        xj, yj = ring[j][0], ring[j][1]
        crosses = (yi > lat) != (yj > lat)
        if crosses:
            x_intersect = (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi
            if lon < x_intersect:
                inside = not inside
        j = i
    return inside


def point_in_polygon(lon, lat, polygon):
    outer = polygon[0]
    holes = polygon[1:]
    if not point_in_ring(lon, lat, outer):
        return False
    return not any(point_in_ring(lon, lat, hole) for hole in holes)


def point_in_any_polygon(lon, lat, polygons):
    return any(point_in_polygon(lon, lat, polygon) for polygon in polygons)


def build_grid(config, force=False):
    boundary_path = materialize_boundary(config, force=force)

    if config.grid_path.exists() and not force:
        print(f"Grid already exists: {config.grid_path}")
        return config.grid_path

    polygons = load_boundary_polygons(boundary_path)
    minx, miny, maxx, maxy = bounds_for_polygons(polygons)
    step = config.grid_cell_size_deg

    rows = []
    cell_id = 0
    lat = miny
    while lat < maxy:
        lon = minx
        while lon < maxx:
            center_lon = lon + step / 2
            center_lat = lat + step / 2
            if point_in_any_polygon(center_lon, center_lat, polygons):
                rows.append(
                    {
                        "cell_id": cell_id,
                        "grid_id": global_grid_id(lat, lon, step),
                        "lat": round(lat, 8),
                        "lon": round(lon, 8),
                    }
                )
                cell_id += 1
            lon += step
        lat += step

    config.grid_path.parent.mkdir(parents=True, exist_ok=True)
    with config.grid_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["cell_id", "grid_id", "lat", "lon"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Boundary: {boundary_path}")
    print(f"Grid ready: {config.grid_path}")
    print(f"Cells: {len(rows):,}")
    return config.grid_path


def main():
    parser = argparse.ArgumentParser(description="Generate a district grid from boundary GeoJSON.")
    parser.add_argument("--district", help="District key from district_config.json")
    parser.add_argument("--force", action="store_true", help="Regenerate boundary copy and grid.")
    args = parser.parse_args()

    config = get_district_config(args.district)
    build_grid(config, force=args.force)


if __name__ == "__main__":
    main()
