from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db import engine
from schema_utils import apply_schema_file


SCHEMA_PATH = BACKEND_ROOT / "db" / "schema.sql"


def main():
    statement_count = apply_schema_file(engine, SCHEMA_PATH)
    print(f"Schema applied: {SCHEMA_PATH}")
    print(f"Statements executed: {statement_count}")


if __name__ == "__main__":
    main()
