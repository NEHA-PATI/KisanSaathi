import sys
import ee
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import time
import os

# =========================================
# CONFIG
# =========================================

EE_PROJECT = "agri-ai-491511"

PROJECT_ROOT = Path(__file__).resolve().parents[2]
GRID_PATH = PROJECT_ROOT / "data" / "grids" / "angul_grid.csv"

BATCH_SIZE = 6000
MAX_ACTIVE_TASKS = 200

OUTPUT_LOG = "processed_tasks.txt"

ee.Initialize(project=EE_PROJECT)

# =========================================
# INPUT
# =========================================

if len(sys.argv) != 4:
    print("Usage: python run.py <batch_start> <start_date> <end_date>")
    sys.exit(1)

batch_start = int(sys.argv[1])
START_DATE = sys.argv[2]
END_DATE = sys.argv[3]

# =========================================
# LOAD GRID
# =========================================

grid = pd.read_csv(GRID_PATH)
batch = grid.iloc[batch_start : batch_start + BATCH_SIZE]

# =========================================
# LOAD COMPLETED TASKS
# =========================================

if os.path.exists(OUTPUT_LOG):
    with open(OUTPUT_LOG, "r") as f:
        completed = set(line.strip() for line in f.readlines())
else:
    completed = set()

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
    features = []

    for _, row in batch_df.iterrows():
        lat, lon = row["lat"], row["lon"]

        geom = ee.Geometry.Rectangle([lon, lat, lon + 0.01, lat + 0.01])

        features.append(ee.Feature(geom, {"cell_id": int(row["cell_id"])}))

    return ee.FeatureCollection(features)


fc = make_fc(batch)

# =========================================
# CLOUD MASK
# =========================================


def mask_s2_clouds(img):
    qa = img.select("QA60")

    cloudBitMask = 1 << 10
    cirrusBitMask = 1 << 11

    mask = qa.bitwiseAnd(cloudBitMask).eq(0).And(qa.bitwiseAnd(cirrusBitMask).eq(0))

    return img.updateMask(mask)


# =========================================
# ADD INDICES
# =========================================


def add_indices(img):

    # Scale reflectance
    img = img.divide(10000)

    # NDVI
    ndvi = img.normalizedDifference(["B8", "B4"]).rename("ndvi")

    # NDWI
    ndwi = img.normalizedDifference(["B3", "B8"]).rename("ndwi")

    # GNDVI
    gndvi = img.normalizedDifference(["B8", "B3"]).rename("gndvi")

    # EVI
    evi = img.expression(
        "2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))",
        {
            "NIR": img.select("B8"),
            "RED": img.select("B4"),
            "BLUE": img.select("B2"),
        },
    ).rename("evi")

    # SAVI
    savi = img.expression(
        "((NIR-RED)/(NIR+RED+0.5))*1.5",
        {
            "NIR": img.select("B8"),
            "RED": img.select("B4"),
        },
    ).rename("savi")

    # BSI
    bsi = img.expression(
        "((RED+SWIR)-(NIR+BLUE))/((RED+SWIR)+(NIR+BLUE))",
        {
            "RED": img.select("B4"),
            "NIR": img.select("B8"),
            "BLUE": img.select("B2"),
            "SWIR": img.select("B11"),
        },
    ).rename("bsi")

    # MSI
    msi = img.expression(
        "SWIR/NIR",
        {
            "SWIR": img.select("B11"),
            "NIR": img.select("B8"),
        },
    ).rename("msi")

    return img.addBands([ndvi, ndwi, gndvi, evi, savi, bsi, msi]).toFloat()


# =========================================
# TASK CONTROL
# =========================================


def active_tasks():
    tasks = ee.data.getTaskList()
    return sum(1 for t in tasks if t["state"] in ["READY", "RUNNING"])


# =========================================
# MAIN LOOP
# =========================================

for start, end in generate_weeks(START_DATE, END_DATE):

    start_str = start.strftime("%Y-%m-%d")
    end_str = end.strftime("%Y-%m-%d")

    task_name = f"sat_b{batch_start}_{start_str}"

    if task_name in completed:
        print(f"⏩ Skipping {task_name}")
        continue

    while active_tasks() > MAX_ACTIVE_TASKS:
        print("⏳ Waiting for slots...")
        time.sleep(15)

    print(f"🚀 Processing {task_name}")

    try:

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterDate(start_str, end_str)
            .filterBounds(fc)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .map(mask_s2_clouds)
            .map(add_indices)
        )

        image = collection.select(
            ["ndvi", "ndwi", "gndvi", "evi", "savi", "bsi", "msi"]
        ).median()

        # =====================================
        # POLYGON AGGREGATION (FIXED)
        # =====================================

        reduced = image.reduceRegions(
            collection=fc, reducer=ee.Reducer.mean(), scale=10
        ).map(
            lambda f: f.set(
                {"date": start_str, "year": start.year, "month": start.month}
            )
        )

        task = ee.batch.Export.table.toDrive(
            collection=reduced,
            description=task_name,
            folder="AgriAI_satellite_sambalpur",
            fileNamePrefix=task_name,
            fileFormat="CSV",
        )

        task.start()

        with open(OUTPUT_LOG, "a") as f:
            f.write(task_name + "\n")

        completed.add(task_name)

    except Exception as e:
        print(f"❌ Error in {task_name}: {e}")
        time.sleep(10)
