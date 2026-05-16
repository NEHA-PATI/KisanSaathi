import argparse
import subprocess
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def command_label(command):
    return " ".join(str(part) for part in command)


def run_command(command):
    print(f"Running: {command_label(command)}")
    process = subprocess.run(command, cwd=PROJECT_ROOT)
    if process.returncode != 0:
        raise RuntimeError(
            f"Command failed ({process.returncode}): {command_label(command)}"
        )


def main():
    parser = argparse.ArgumentParser(
        description="Run global training step (after normalization)."
    )
    parser.add_argument(
        "--model-name",
        default="state_model.pkl",
        help="Model filename inside ml/models.",
    )
    parser.add_argument(
        "--all-districts",
        action="store_true",
        help="Train on every configured district that has processed/final.parquet.",
    )
    args = parser.parse_args()

    print("=== TRAINING: Starting global training ===")
    cmd = [sys.executable, "-m", "ml.train"]
    if args.all_districts:
        cmd.append("--all-districts")
    if args.model_name:
        cmd.extend(["--model-name", args.model_name])

    run_command(cmd)
    print("=== TRAINING: Completed global training ===")


if __name__ == "__main__":
    main()
