import ee
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
import time

# =========================================
# CONFIG
# =========================================
EE_PROJECT = "agri-ai-491511"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
GRID_PATH = PROJECT_ROOT / "data" / "grids" / "sambalpur_grid.csv"

START_DATE = "2020-01-01"
END_DATE = "2026-04-29"

BATCH_SIZE = 6000
MAX_ACTIVE_TASKS = 100

ee.Initialize(project=EE_PROJECT)

# =========================================
# LOAD GRID
# =========================================
grid = pd.read_csv(GRID_PATH)


# =========================================
# WEEK GENERATOR
# =========================================
def generate_weeks(start, end):
    start = datetime.strptime(start, "%Y-%m-%d")
    end = datetime.strptime(end, "%Y-%m-%d")
    while start <= end:
        nxt = start + timedelta(days=7)
        yield start, nxt
        start = nxt


# =========================================
# GRID → POLYGON FC
# =========================================
def make_fc(batch_df):
    feats = []
    for _, r in batch_df.iterrows():
        lat, lon = r["lat"], r["lon"]
        geom = ee.Geometry.Rectangle([lon, lat, lon + 0.01, lat + 0.01])
        feats.append(ee.Feature(geom, {"cell_id": int(r["cell_id"])}))
    return ee.FeatureCollection(feats)


# =========================================
# TASK CONTROL
# =========================================
def active_tasks():
    tasks = ee.data.getTaskList()
    return sum(1 for t in tasks if t["state"] in ["READY", "RUNNING"])


# =========================================
# MAIN LOOP
# =========================================
for batch_start in range(0, len(grid), BATCH_SIZE):

    batch = grid.iloc[batch_start : batch_start + BATCH_SIZE]
    fc = make_fc(batch)

    for start, end in generate_weeks(START_DATE, END_DATE):

        start_str = start.strftime("%Y-%m-%d")
        end_str = end.strftime("%Y-%m-%d")

        task_name = f"smap_b{batch_start}_{start_str}"

        while active_tasks() > MAX_ACTIVE_TASKS:
            print("⏳ Waiting for GEE slots...")
            time.sleep(15)

        print(f"🚀 {task_name}")

        try:
            collection = (
                ee.ImageCollection("NASA/SMAP/SPL4SMGP/007")
                .filterDate(start_str, end_str)
                .select(["sm_surface", "sm_rootzone"])
                .map(
                    lambda img: img.rename(
                        ["soil_moisture_surface", "soil_moisture_root"]
                    )
                )
            )

            image = collection.mean()

            reduced = image.reduceRegions(
                collection=fc,
                reducer=ee.Reducer.mean(),
                scale=10000,  # SMAP ~10km resolution
            ).map(
                lambda f: f.set(
                    {"date": start_str, "year": start.year, "month": start.month}
                )
            )

            task = ee.batch.Export.table.toDrive(
                collection=reduced,
                description=task_name,
                folder="AgriAI_SMAP",
                fileNamePrefix=task_name,
                fileFormat="CSV",
            )

            task.start()

        except Exception as e:
            print(f"❌ Error in {task_name}: {e}")
            time.sleep(10)
