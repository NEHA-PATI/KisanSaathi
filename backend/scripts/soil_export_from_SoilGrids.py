import ee
import pandas as pd
from pathlib import Path
import time

# =========================================
# CONFIG
# =========================================

EE_PROJECT = "agri-ai-491511"
GRID_PATH = Path("../data/grids/sambalpur_grid.csv")


BATCH_SIZE = 6000
MAX_ACTIVE_TASKS = 200

ee.Initialize(project=EE_PROJECT)

# =========================================
# DATASETS
# =========================================

DATASETS = {
    "phh2o": "projects/soilgrids-isric/phh2o_mean",
    "soc": "projects/soilgrids-isric/soc_mean",
    "clay": "projects/soilgrids-isric/clay_mean",
    "sand": "projects/soilgrids-isric/sand_mean",
    "silt": "projects/soilgrids-isric/silt_mean",
}

# =========================================
# LOAD GRID
# =========================================

grid = pd.read_csv(GRID_PATH)

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


# =========================================
# TASK CONTROL
# =========================================


def active_tasks():
    tasks = ee.data.getTaskList()
    return sum(1 for t in tasks if t["state"] in ["READY", "RUNNING"])


# =========================================
# BUILD STACKED IMAGE
# =========================================


def build_soil_image():
    bands = []

    for key, dataset in DATASETS.items():
        img = ee.Image(dataset)

        band_names = img.bandNames()

        # clean naming
        renamed = band_names.map(
            lambda b: ee.String(key)
            .cat("_")
            .cat(ee.String(b).replace("cm_mean", "").replace("_", ""))
        )

        img = img.rename(renamed)
        bands.append(img)

    return ee.Image.cat(bands)


soil_image = build_soil_image()

# =========================================
# MAIN LOOP
# =========================================

for batch_start in range(0, len(grid), BATCH_SIZE):

    batch = grid.iloc[batch_start : batch_start + BATCH_SIZE]
    fc = make_fc(batch)

    task_name = f"soil_b{batch_start}"

    while active_tasks() > MAX_ACTIVE_TASKS:
        print("⏳ Waiting...")
        time.sleep(15)

    print(f"🚀 {task_name}")

    try:
        reduced = soil_image.reduceRegions(
            collection=fc, reducer=ee.Reducer.mean(), scale=250
        )

        task = ee.batch.Export.table.toDrive(
            collection=reduced,
            description=task_name,
            folder="AgriAI_soil",
            fileNamePrefix=task_name,
            fileFormat="CSV",
        )

        task.start()

    except Exception as e:
        print(f"❌ Error: {e}")
        time.sleep(10)
