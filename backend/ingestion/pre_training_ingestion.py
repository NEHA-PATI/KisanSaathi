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


def main():
    parser = argparse.ArgumentParser(
        description="Pre-training ingestion steps for one district."
    )
    parser.add_argument(
        "--district", required=True, help="District key from district_config.json"
    )
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
    parser.add_argument("--open-terminals", action="store_true")
    parser.add_argument("--reset-task-logs", action="store_true")
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
        print(f"=== GRID: generating for {config.slug} ===")
        from ingestion.generate_grid import build_grid

        build_grid(config, force=args.force_grid)
        print("=== GRID: done ===")
    else:
        print(f"Skipping grid generation for: {config.slug}")

    if args.reset_task_logs:
        reset_task_logs(config, args.sources)

    if not args.skip_exports:
        if args.open_terminals:
            open_export_terminals(config, args.sources)
            return
        print(f"=== EXPORTS: starting exports for {config.slug} ===")
        run_exports(config, args.sources)
        print(f"=== EXPORTS: finished for {config.slug} ===")

    if not args.skip_ee_wait:
        print("=== EE WAIT: polling Earth Engine for tasks ===")
        wait_for_earth_engine_exports(config, args.sources, args.poll_seconds)
        print("=== EE WAIT: done ===")

    if not args.skip_download:
        print(f"=== DOWNLOAD: downloading exports for {config.slug} ===")
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
        print("=== DOWNLOAD: done ===")

    print(f"=== NORMALIZATION: starting for {config.slug} ===")
    run_command(
        [
            sys.executable,
            str(PROJECT_ROOT / "backend" / "scripts" / "normalization.py"),
            "--district",
            config.slug,
        ],
        config.log_dir / "normalization.log",
    )
    print(f"=== NORMALIZATION: finished for {config.slug} ===")

    print(f"Pre-training ingestion finished: {config.slug}")


if __name__ == "__main__":
    main()
