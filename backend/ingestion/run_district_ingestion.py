import argparse
import subprocess
import sys
import time
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import SOURCES, ensure_district_dirs, get_district_config
from ingestion.generate_grid import build_grid

EXPORT_SCRIPTS = {
    "satellite": PROJECT_ROOT / "backend" / "scripts" / "satellite_export_from_gee.py",
    "weather": PROJECT_ROOT / "backend" / "scripts" / "weather_export_from_gee.py",
    "smap": PROJECT_ROOT / "backend" / "scripts" / "smap_export.py",
    "et": PROJECT_ROOT / "backend" / "scripts" / "et_export_from_modis.py",
    "soil": PROJECT_ROOT / "backend" / "scripts" / "soil_export_from_SoilGrids.py",
    "crop": PROJECT_ROOT / "backend" / "scripts" / "crop_cover_export_from_esa.py",
}


def command_label(command):
    return " ".join(str(part) for part in command)


def run_command(command, log_path=None):
    print(f"Running: {command_label(command)}")
    if log_path:
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("w", encoding="utf-8") as log:
            process = subprocess.run(
                command,
                cwd=PROJECT_ROOT,
                stdout=log,
                stderr=subprocess.STDOUT,
                text=True,
            )
    else:
        process = subprocess.run(command, cwd=PROJECT_ROOT)

    if process.returncode != 0:
        raise RuntimeError(
            f"Command failed ({process.returncode}): {command_label(command)}"
        )


def run_exports(config, sources):
    processes = []
    for source in sources:
        log_path = config.export_process_log(source)
        command = [
            sys.executable,
            str(EXPORT_SCRIPTS[source]),
            "--district",
            config.slug,
        ]
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log = log_path.open("w", encoding="utf-8")
        print(f"Starting {source} export -> {log_path}")
        process = subprocess.Popen(
            command,
            cwd=PROJECT_ROOT,
            stdout=log,
            stderr=subprocess.STDOUT,
            text=True,
        )
        processes.append((source, process, log))

    failed = []
    for source, process, log in processes:
        return_code = process.wait()
        log.close()
        if return_code != 0:
            failed.append((source, return_code))

    if failed:
        details = ", ".join(f"{source}={code}" for source, code in failed)
        raise RuntimeError(f"Export subprocess failed: {details}")


def reset_task_logs(config, sources):
    for source in sources:
        path = config.export_task_log(source)
        if path.exists():
            path.unlink()
            print(f"Reset submitted-task log: {path}")


def open_export_terminals(config, sources):
    for source in sources:
        command = (
            f"cd '{PROJECT_ROOT}'; "
            f"& '{sys.executable}' '{EXPORT_SCRIPTS[source]}' --district {config.slug}; "
            "Read-Host 'Press Enter to close this export window'"
        )
        subprocess.Popen(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"Start-Process powershell -ArgumentList @('-NoProfile','-NoExit','-Command',{command!r})",
            ],
            cwd=PROJECT_ROOT,
        )

    print(
        "Opened export terminals. Re-run without --open-terminals when exports are complete."
    )


def wait_for_earth_engine_exports(config, sources, poll_seconds):
    import ee

    ee.Initialize(project=config.ee_project)
    prefixes = tuple(config.task_prefix(source) for source in sources)

    while True:
        tasks = ee.data.getTaskList()
        active = [
            task
            for task in tasks
            if task.get("description", "").startswith(prefixes)
            and task.get("state") in {"READY", "RUNNING"}
        ]
        failed = [
            task
            for task in tasks
            if task.get("description", "").startswith(prefixes)
            and task.get("state") in {"FAILED", "CANCELLED"}
        ]

        print(f"Earth Engine active district tasks: {len(active)}")
        if failed:
            print(f"Earth Engine failed/cancelled district tasks: {len(failed)}")
            for task in failed[:10]:
                print(f"  {task.get('description')} -> {task.get('state')}")

        if not active:
            return

        time.sleep(poll_seconds)


def run_processing(config, append_db):
    print(f"=== START: normalization -> {config.log_dir / 'normalization.log'}")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "backend" / "scripts" / "normalization.py"),
            "--district",
            config.slug,
        ],
        config.log_dir / "normalization.log",
    )
    print("=== DONE: normalization")

    # Train the model on this district (creates/updates ml/models/state_model.pkl)
    print(f"=== START: train -> {config.log_dir / 'train.log'}")
    run_command(
        [sys.executable, "-m", "ml.train", "--district", config.slug],
        config.log_dir / "train.log",
    )
    print("=== DONE: train")

    print(f"=== START: predict_batch -> {config.log_dir / 'predict_batch.log'}")
    run_command(
        [sys.executable, "-m", "ml.predict_batch", "--district", config.slug],
        config.log_dir / "predict_batch.log",
    )
    print("=== DONE: predict_batch")

    print(f"=== START: clean_predictions -> {config.log_dir / 'clean_predictions.log'}")
    run_command(
        [sys.executable, "-m", "ml.clean_predictions", "--district", config.slug],
        config.log_dir / "clean_predictions.log",
    )
    print("=== DONE: clean_predictions")

    print(f"=== START: prepare_for_db -> {config.log_dir / 'prepare_for_db.log'}")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "backend" / "scripts" / "prepare_for_db.py"),
            "--district",
            config.slug,
        ],
        config.log_dir / "prepare_for_db.log",
    )
    print("=== DONE: prepare_for_db")

    print(f"=== START: prepare_postgis -> {config.log_dir / 'prepare_postgis.log'}")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "backend" / "scripts" / "prepare_postgis.py"),
            "--district",
            config.slug,
        ],
        config.log_dir / "prepare_postgis.log",
    )
    print("=== DONE: prepare_postgis")

    print(f"=== START: load_grid_to_db -> {config.log_dir / 'load_grid_to_db.log'}")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "backend" / "scripts" / "load_grid_to_db.py"),
            "--district",
            config.slug,
        ],
        config.log_dir / "load_grid_to_db.log",
    )
    print("=== DONE: load_grid_to_db")

    load_command = [
        sys.executable,
        str(PROJECT_ROOT / "backend" / "scripts" / "load_to_db.py"),
        "--district",
        config.slug,
    ]
    if append_db:
        load_command.append("--append")
    run_command(load_command, config.log_dir / "load_to_db.log")


def main():
    parser = argparse.ArgumentParser(description="Run one district ingestion pipeline.")
    parser.add_argument("--district", help="District key from district_config.json")
    parser.add_argument(
        "--force-grid", action="store_true", help="Regenerate district grid."
    )
    parser.add_argument(
        "--skip-grid",
        action="store_true",
        help="Skip grid generation and boundary materialization.",
    )
    parser.add_argument("--skip-exports", action="store_true")
    parser.add_argument("--skip-ee-wait", action="store_true")
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--skip-processing", action="store_true")
    parser.add_argument("--skip-db", action="store_true")
    parser.add_argument(
        "--append-db",
        dest="append_db",
        action="store_true",
        help="Append this district instead of replacing agri_predictions.",
    )
    parser.add_argument(
        "--no-append-db",
        dest="append_db",
        action="store_false",
        help="Do not append; replace agri_predictions for this district.",
    )
    parser.set_defaults(append_db=True)
    parser.add_argument("--open-terminals", action="store_true")
    parser.add_argument(
        "--reset-task-logs",
        action="store_true",
        help="Clear district submitted-task logs before launching exports.",
    )
    parser.add_argument("--poll-seconds", type=int, default=300)
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=SOURCES,
        default=list(SOURCES),
        help="Sources to export/download.",
    )
    args = parser.parse_args()

    config = get_district_config(args.district)
    ensure_district_dirs(config)
    if not args.skip_grid:
        build_grid(config, force=args.force_grid)
    else:
        print(f"Skipping grid generation for: {config.slug}")

    if args.reset_task_logs:
        reset_task_logs(config, args.sources)

    if not args.skip_exports:
        if args.open_terminals:
            open_export_terminals(config, args.sources)
            return
        run_exports(config, args.sources)

    if not args.skip_ee_wait:
        wait_for_earth_engine_exports(config, args.sources, args.poll_seconds)

    if not args.skip_download:
        run_command(
            [
                sys.executable,
                str(PROJECT_ROOT / "backend" / "scripts" / "download_from_drive.py"),
                "--district",
                config.slug,
                "--sources",
                *args.sources,
            ],
            config.log_dir / "download_from_drive.log",
        )

    if not args.skip_processing:
        if args.skip_db:
            print(f"=== START: normalization -> {config.log_dir / 'normalization.log'}")
            run_command(
                [
                    sys.executable,
                    str(PROJECT_ROOT / "backend" / "scripts" / "normalization.py"),
                    "--district",
                    config.slug,
                ],
                config.log_dir / "normalization.log",
            )
            print("=== DONE: normalization")

            print(f"=== START: train -> {config.log_dir / 'train.log'}")
            run_command(
                [sys.executable, "-m", "ml.train", "--district", config.slug],
                config.log_dir / "train.log",
            )
            print("=== DONE: train")

            print(f"=== START: predict_batch -> {config.log_dir / 'predict_batch.log'}")
            run_command(
                [sys.executable, "-m", "ml.predict_batch", "--district", config.slug],
                config.log_dir / "predict_batch.log",
            )
            print("=== DONE: predict_batch")

            print(
                f"=== START: clean_predictions -> {config.log_dir / 'clean_predictions.log'}"
            )
            run_command(
                [
                    sys.executable,
                    "-m",
                    "ml.clean_predictions",
                    "--district",
                    config.slug,
                ],
                config.log_dir / "clean_predictions.log",
            )
            print("=== DONE: clean_predictions")

            print(
                f"=== START: prepare_for_db -> {config.log_dir / 'prepare_for_db.log'}"
            )
            run_command(
                [
                    sys.executable,
                    str(PROJECT_ROOT / "backend" / "scripts" / "prepare_for_db.py"),
                    "--district",
                    config.slug,
                ],
                config.log_dir / "prepare_for_db.log",
            )
            print("=== DONE: prepare_for_db")

            print(
                f"=== START: prepare_postgis -> {config.log_dir / 'prepare_postgis.log'}"
            )
            run_command(
                [
                    sys.executable,
                    str(PROJECT_ROOT / "backend" / "scripts" / "prepare_postgis.py"),
                    "--district",
                    config.slug,
                ],
                config.log_dir / "prepare_postgis.log",
            )
            print("=== DONE: prepare_postgis")
        else:
            run_processing(config, append_db=args.append_db)

    print(f"District ingestion finished: {config.slug}")
    print(f"District data root: {config.district_root}")


if __name__ == "__main__":
    main()
