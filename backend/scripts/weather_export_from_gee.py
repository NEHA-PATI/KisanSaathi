import sys
import time
from pathlib import Path

import ee

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.ee_common import (
    collection_or_empty,
    export_context,
    generate_weeks,
    iter_batches,
    make_fc,
    mark_completed,
    read_completed_tasks,
    read_grid,
    wait_for_task_slot,
)


SOURCE = "weather"
WEATHER_BANDS = [
    "temperature_2m",
    "total_precipitation_sum",
    "dewpoint_temperature_2m",
    "surface_solar_radiation_downwards_sum",
    "volumetric_soil_water_layer_1",
    "volumetric_soil_water_layer_2",
]


def get_collection(start, end, fc):
    return (
        ee.ImageCollection("ECMWF/ERA5_LAND/DAILY_AGGR")
        .filterDate(start, end)
        .filterBounds(fc)
        .select(WEATHER_BANDS)
    )


def main():
    args, config, start_date, end_date = export_context(SOURCE)
    ee.Initialize(project=config.ee_project)

    grid = read_grid(config)
    completed_log = config.export_task_log(SOURCE)
    completed = read_completed_tasks(completed_log)

    for batch_start, batch in iter_batches(grid, config.batch_size, args.batch_start):
        fc = make_fc(ee, batch, config.grid_cell_size_deg)

        for start, end in generate_weeks(start_date, end_date):
            start_str = start.strftime("%Y-%m-%d")
            end_str = end.strftime("%Y-%m-%d")
            task_name = f"{config.task_prefix(SOURCE)}_b{batch_start}_{start_str}"

            if task_name in completed:
                print(f"Skipping submitted task: {task_name}")
                continue

            wait_for_task_slot(ee, config.max_active_tasks)
            print(f"Submitting {task_name}")

            try:
                image = collection_or_empty(
                    ee,
                    get_collection(start_str, end_str, fc),
                    lambda images: images.mean(),
                    WEATHER_BANDS,
                )
                reduced = image.reduceRegions(
                    collection=fc,
                    reducer=ee.Reducer.mean(),
                    scale=1000,
                ).map(
                    lambda feature: feature.set(
                        {"date": start_str, "year": start.year, "month": start.month}
                    )
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
