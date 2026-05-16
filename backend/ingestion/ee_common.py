import argparse
import time
from datetime import datetime, timedelta

import pandas as pd

from ingestion.config import get_district_config


def parse_export_args(source):
    parser = argparse.ArgumentParser(description=f"Submit {source} exports for a district.")
    parser.add_argument("--district", help="District key from district_config.json")
    parser.add_argument("--batch-start", type=int, help="Only submit one grid batch.")
    parser.add_argument("--start-date", help="Override configured start date.")
    parser.add_argument("--end-date", help="Override configured end date.")
    return parser.parse_args()


def export_context(source):
    args = parse_export_args(source)
    config = get_district_config(args.district)
    start_date = args.start_date or config.start_date
    end_date = args.end_date or config.end_date
    return args, config, start_date, end_date


def generate_weeks(start, end):
    start = datetime.strptime(start, "%Y-%m-%d")
    end = datetime.strptime(end, "%Y-%m-%d")
    while start <= end:
        nxt = start + timedelta(days=7)
        yield start, nxt
        start = nxt


def read_grid(config):
    return pd.read_csv(config.grid_path)


def iter_batches(grid, batch_size, batch_start=None):
    if batch_start is not None:
        yield batch_start, grid.iloc[batch_start : batch_start + batch_size]
        return

    for start in range(0, len(grid), batch_size):
        yield start, grid.iloc[start : start + batch_size]


def make_fc(ee, batch_df, cell_size):
    features = []
    for _, row in batch_df.iterrows():
        lat, lon = row["lat"], row["lon"]
        geom = ee.Geometry.Rectangle([lon, lat, lon + cell_size, lat + cell_size])
        properties = {"cell_id": int(row["cell_id"])}
        if "grid_id" in batch_df.columns:
            properties["grid_id"] = str(row["grid_id"])
        features.append(ee.Feature(geom, properties))
    return ee.FeatureCollection(features)


def active_tasks(ee):
    tasks = ee.data.getTaskList()
    return sum(1 for task in tasks if task["state"] in ["READY", "RUNNING"])


def wait_for_task_slot(ee, max_active_tasks):
    while active_tasks(ee) > max_active_tasks:
        print("Waiting for Earth Engine task slots...")
        time.sleep(15)


def empty_masked_image(ee, band_names):
    image = ee.Image.constant([0] * len(band_names)).rename(band_names).toFloat()
    return image.updateMask(ee.Image.constant(0))


def collection_or_empty(ee, collection, reducer, band_names):
    fallback = empty_masked_image(ee, band_names)
    image = ee.Algorithms.If(collection.size().gt(0), reducer(collection), fallback)
    return ee.Image(image).select(band_names)


def read_completed_tasks(path):
    if not path.exists():
        return set()
    return {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


def mark_completed(path, task_name):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as file:
        file.write(task_name + "\n")
