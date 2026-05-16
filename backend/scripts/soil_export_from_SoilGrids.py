import sys
import time
from pathlib import Path

import ee

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.ee_common import (
    export_context,
    iter_batches,
    make_fc,
    mark_completed,
    read_completed_tasks,
    read_grid,
    wait_for_task_slot,
)


SOURCE = "soil"
DATASETS = {
    "phh2o": "projects/soilgrids-isric/phh2o_mean",
    "soc": "projects/soilgrids-isric/soc_mean",
    "clay": "projects/soilgrids-isric/clay_mean",
    "sand": "projects/soilgrids-isric/sand_mean",
    "silt": "projects/soilgrids-isric/silt_mean",
}


def build_soil_image():
    bands = []
    for key, dataset in DATASETS.items():
        img = ee.Image(dataset)
        renamed = img.bandNames().map(
            lambda band: ee.String(key)
            .cat("_")
            .cat(ee.String(band).replace("cm_mean", "").replace("_", ""))
        )
        bands.append(img.rename(renamed))
    return ee.Image.cat(bands)


def main():
    args, config, _, _ = export_context(SOURCE)
    ee.Initialize(project=config.ee_project)

    grid = read_grid(config)
    soil_image = build_soil_image()
    completed_log = config.export_task_log(SOURCE)
    completed = read_completed_tasks(completed_log)

    for batch_start, batch in iter_batches(grid, config.batch_size, args.batch_start):
        task_name = f"{config.task_prefix(SOURCE)}_b{batch_start}"

        if task_name in completed:
            print(f"Skipping submitted task: {task_name}")
            continue

        wait_for_task_slot(ee, config.max_active_tasks)
        print(f"Submitting {task_name}")

        try:
            fc = make_fc(ee, batch, config.grid_cell_size_deg)
            reduced = soil_image.reduceRegions(
                collection=fc,
                reducer=ee.Reducer.mean(),
                scale=250,
            )
            task = ee.batch.Export.table.toDrive(
                collection=reduced,
                description=task_name,
                folder=config.drive_folder(SOURCE),
                fileNamePrefix=task_name,
                fileFormat="CSV",
            )
            task.start()
            mark_completed(completed_log, task_name)
            completed.add(task_name)
        except Exception as exc:
            print(f"Error in {task_name}: {exc}")
            time.sleep(10)


if __name__ == "__main__":
    main()
