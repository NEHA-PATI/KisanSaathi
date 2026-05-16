import argparse
import subprocess
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import get_district_config, list_district_keys


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


def resolve_districts(args):
    if args.all_districts:
        return list(list_district_keys())
    if args.district:
        return args.district
    raise ValueError("Provide --district (one or more) or --all-districts")


def main():
    parser = argparse.ArgumentParser(
        description="Post-training steps for districts: predict, clean, prepare and load DB."
    )
    parser.add_argument(
        "--district",
        nargs="+",
        help="One or more district keys from district_config.json.",
    )
    parser.add_argument(
        "--all-districts",
        action="store_true",
        help="Run post-training for all configured districts.",
    )
    parser.add_argument(
        "--no-append-db",
        dest="append_db",
        action="store_false",
        help="Replace DB data for this district instead of appending.",
    )
    parser.add_argument(
        "--append-db",
        dest="append_db",
        action="store_true",
        help="Append DB data for this district.",
    )
    parser.set_defaults(append_db=True)
    args = parser.parse_args()

    districts = resolve_districts(args)

    for district in districts:
        config = get_district_config(district)
        print(f"=== POST: starting post-training steps for {config.slug} ===")

        print(f"--- PREDICT: running predict_batch for {config.slug} ---")
        run_command(
            [sys.executable, "-m", "ml.predict_batch", "--district", config.slug],
            config.log_dir / "predict_batch.log",
        )
        print(f"--- PREDICT: done for {config.slug} ---")

        print(f"--- CLEAN: running clean_predictions for {config.slug} ---")
        run_command(
            [sys.executable, "-m", "ml.clean_predictions", "--district", config.slug],
            config.log_dir / "clean_predictions.log",
        )
        print(f"--- CLEAN: done for {config.slug} ---")

        print(f"--- PREPARE: prepare_for_db for {config.slug} ---")
        run_command(
            [
                sys.executable,
                str(PROJECT_ROOT / "backend" / "scripts" / "prepare_for_db.py"),
                "--district",
                config.slug,
            ],
            config.log_dir / "prepare_for_db.log",
        )
        print(f"--- PREPARE: done for {config.slug} ---")

        print(f"--- POSTGIS: prepare_postgis for {config.slug} ---")
        run_command(
            [
                sys.executable,
                str(PROJECT_ROOT / "backend" / "scripts" / "prepare_postgis.py"),
                "--district",
                config.slug,
            ],
            config.log_dir / "prepare_postgis.log",
        )
        print(f"--- POSTGIS: done for {config.slug} ---")

        print(f"--- LOAD GRID: load_grid_to_db for {config.slug} ---")
        run_command(
            [
                sys.executable,
                str(PROJECT_ROOT / "backend" / "scripts" / "load_grid_to_db.py"),
                "--district",
                config.slug,
            ],
            config.log_dir / "load_grid_to_db.log",
        )
        print(f"--- LOAD GRID: done for {config.slug} ---")

        print(
            f"--- LOAD DB: load_to_db for {config.slug} (append={args.append_db}) ---"
        )
        load_cmd = [
            sys.executable,
            str(PROJECT_ROOT / "backend" / "scripts" / "load_to_db.py"),
            "--district",
            config.slug,
        ]
        if args.append_db:
            load_cmd.append("--append")
        run_command(load_cmd, config.log_dir / "load_to_db.log")
        print(f"--- LOAD DB: done for {config.slug} ---")

        print(f"=== POST: finished post-training for {config.slug} ===")


if __name__ == "__main__":
    main()
