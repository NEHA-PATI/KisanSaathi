import os
import shutil
import json
from dataclasses import dataclass
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).with_name("district_config.json")
SOURCES = ("satellite", "weather", "smap", "et", "soil", "crop")


def _load_config():
    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def _resolve_project_path(value):
    path = Path(value)
    return path if path.is_absolute() else PROJECT_ROOT / path


@dataclass(frozen=True)
class DistrictConfig:
    slug: str
    name: str
    ee_project: str
    start_date: str
    end_date: str
    grid_cell_size_deg: float
    batch_size: int
    max_active_tasks: int
    source_boundary_path: Path
    district_root: Path
    drive_folders: dict

    @property
    def boundary_dir(self):
        return self.district_root / "boundary"

    @property
    def boundary_path(self):
        return self.boundary_dir / f"{self.slug}_boundary.geojson"

    @property
    def grid_dir(self):
        return self.district_root / "grids"

    @property
    def grid_path(self):
        return self.grid_dir / f"{self.slug}_grid.csv"

    @property
    def raw_dir(self):
        return self.district_root / "raw"

    @property
    def processed_dir(self):
        return self.district_root / "processed"

    @property
    def ingestion_data_dir(self):
        return self.processed_dir / "ingestion_data"

    @property
    def log_dir(self):
        return self.district_root / "logs"

    @property
    def export_log_dir(self):
        return self.log_dir / "export_tasks"

    def raw_source_dir(self, source):
        return self.raw_dir / source

    def drive_folder(self, source):
        return self.drive_folders[source]

    def export_task_log(self, source):
        return self.export_log_dir / f"{source}_submitted.txt"

    def export_process_log(self, source):
        return self.log_dir / f"export_{source}.log"

    def task_prefix(self, source):
        return f"{self.slug}_{source}"


def get_district_config(district=None):
    raw = _load_config()
    defaults = raw.get("defaults", {})
    district_key = district or os.getenv("BHOOMI_DISTRICT") or raw["active_district"]
    district_data = raw["districts"][district_key]
    merged = {**defaults, **district_data}

    data_root = _resolve_project_path(merged.get("data_root", "data/districts"))
    slug = merged["slug"]

    drive_folders = {}
    for source in SOURCES:
        drive_folders[source] = merged.get("drive_folders", {}).get(
            source,
            f"AgriAI_{source}_{slug}",
        )

    return DistrictConfig(
        slug=slug,
        name=merged.get("name", slug.title()),
        ee_project=merged["ee_project"],
        start_date=str(merged["start_date"]),
        end_date=str(merged["end_date"]),
        grid_cell_size_deg=float(merged["grid_cell_size_deg"]),
        batch_size=int(merged["batch_size"]),
        max_active_tasks=int(merged["max_active_tasks"]),
        source_boundary_path=_resolve_project_path(merged["source_boundary_path"]),
        district_root=data_root / slug,
        drive_folders=drive_folders,
    )


def list_district_keys():
    raw = _load_config()
    return sorted(raw.get("districts", {}).keys())


def ensure_district_dirs(config):
    for path in [
        config.boundary_dir,
        config.grid_dir,
        config.processed_dir,
        config.ingestion_data_dir,
        config.log_dir,
        config.export_log_dir,
        *(config.raw_source_dir(source) for source in SOURCES),
    ]:
        path.mkdir(parents=True, exist_ok=True)


def materialize_boundary(config, force=False):
    ensure_district_dirs(config)
    if config.boundary_path.exists() and not force:
        return config.boundary_path
    shutil.copy2(config.source_boundary_path, config.boundary_path)
    return config.boundary_path
