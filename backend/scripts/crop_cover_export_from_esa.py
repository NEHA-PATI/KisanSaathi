import ee
import pandas as pd
from pathlib import Path
import time

# =========================================
# CONFIG
# =========================================
EE_PROJECT = "agri-ai-491511"

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GRID_PATH = PROJECT_ROOT / "data" / "grids" / "sambalpur_grid.csv"

BATCH_SIZE = 6000
MAX_ACTIVE_TASKS = 100

ee.Initialize(project=EE_PROJECT)

# =========================================
# LOAD GRID
# =========================================
grid = pd.read_csv(GRID_PATH)


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
# LAND COVER IMAGE
# =========================================
image = ee.ImageCollection("ESA/WorldCover/v100").first().select("Map")

# =========================================
# MAIN LOOP
# =========================================
for batch_start in range(0, len(grid), BATCH_SIZE):

    batch = grid.iloc[batch_start : batch_start + BATCH_SIZE]
    fc = make_fc(batch)

    task_name = f"crop_map_b{batch_start}"

    while active_tasks() > MAX_ACTIVE_TASKS:
        print("⏳ Waiting...")
        time.sleep(15)

    print(f"🚀 {task_name}")

    try:
        reduced = image.reduceRegions(
            collection=fc, reducer=ee.Reducer.mode(), scale=10  # dominant class in grid
        )

        task = ee.batch.Export.table.toDrive(
            collection=reduced,
            description=task_name,
            folder="AgriAI_crop",
            fileNamePrefix=task_name,
            fileFormat="CSV",
        )

        task.start()

    except Exception as e:
        print(f"❌ Error: {e}")
        time.sleep(10)
