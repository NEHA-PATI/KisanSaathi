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


SOURCE = "satellite"
SATELLITE_BANDS = ["ndvi", "ndwi", "gndvi", "evi", "savi", "bsi", "msi"]


def mask_s2_clouds(img):
    qa = img.select("QA60")
    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11
    mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(
        qa.bitwiseAnd(cirrus_bit_mask).eq(0)
    )
    return img.updateMask(mask)


def add_indices(img):
    img = img.divide(10000)

    ndvi = img.normalizedDifference(["B8", "B4"]).rename("ndvi")
    ndwi = img.normalizedDifference(["B3", "B8"]).rename("ndwi")
    gndvi = img.normalizedDifference(["B8", "B3"]).rename("gndvi")
    evi = img.expression(
        "2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))",
        {
            "NIR": img.select("B8"),
            "RED": img.select("B4"),
            "BLUE": img.select("B2"),
        },
    ).rename("evi")
    savi = img.expression(
        "((NIR-RED)/(NIR+RED+0.5))*1.5",
        {"NIR": img.select("B8"), "RED": img.select("B4")},
    ).rename("savi")
    bsi = img.expression(
        "((RED+SWIR)-(NIR+BLUE))/((RED+SWIR)+(NIR+BLUE))",
        {
            "RED": img.select("B4"),
            "NIR": img.select("B8"),
            "BLUE": img.select("B2"),
            "SWIR": img.select("B11"),
        },
    ).rename("bsi")
    msi = img.expression(
        "SWIR/NIR",
        {"SWIR": img.select("B11"), "NIR": img.select("B8")},
    ).rename("msi")

    return img.addBands([ndvi, ndwi, gndvi, evi, savi, bsi, msi]).toFloat()


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
                collection = (
                    ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                    .filterDate(start_str, end_str)
                    .filterBounds(fc)
                    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
                    .map(mask_s2_clouds)
                    .map(add_indices)
                )

                image = collection_or_empty(
                    ee,
                    collection.select(SATELLITE_BANDS),
                    lambda images: images.median(),
                    SATELLITE_BANDS,
                )

                reduced = image.reduceRegions(
                    collection=fc,
                    reducer=ee.Reducer.mean(),
                    scale=10,
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
