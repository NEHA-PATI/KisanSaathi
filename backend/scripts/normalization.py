# ============================================================
# NORMALIZATION PIPELINE (ALL-IN-ONE)
# Toggle sections via flags below
# ============================================================

import pandas as pd
import glob
from pathlib import Path

# =========================
# CONFIG
# =========================

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAW_DIR = PROJECT_ROOT / "data" / "raw"
OUT_DIR = PROJECT_ROOT / "data" / "processed"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---- Toggle which pipelines to run ----
RUN_SATELLITE = False
RUN_WEATHER = False
RUN_SMAP = False
RUN_ET = False
RUN_SOIL = False
RUN_CROP = False

RUN_FINAL_MERGE = True  # set False if you only want per-source outputs

# =========================
# HELPERS
# =========================

DROP_COMMON = ["system:index", ".geo"]


def _read_all(pattern):
    files = glob.glob(pattern)
    dfs = []
    for f in files:
        try:
            df = pd.read_csv(f)
            dfs.append(df)
        except Exception as e:
            print(f"Failed to read {f}: {e}")
    if not dfs:
        print(f"No files found for pattern: {pattern}")
        return pd.DataFrame()
    return pd.concat(dfs, ignore_index=True)


def _finalize_ts(df):
    """Common cleanup for time-series tables"""
    # drop junk
    df = df.drop(columns=DROP_COMMON, errors="ignore")

    # enforce types
    if "cell_id" in df.columns:
        df["cell_id"] = df["cell_id"].astype("int64", errors="ignore")

    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # remove rows without keys
    if "date" in df.columns:
        df = df.dropna(subset=["cell_id", "date"])
        df = df.drop_duplicates(["cell_id", "date"])
    else:
        df = df.dropna(subset=["cell_id"])
        df = df.drop_duplicates(["cell_id"])

    return df


def _save(df, name):
    path = OUT_DIR / f"{name}.parquet"
    df.to_parquet(path, index=False)
    print(f"Saved {name} -> {path}")


# =========================
# SATELLITE
# =========================


def normalize_satellite():
    df = _read_all(str(RAW_DIR / "satellite" / "*.csv"))
    if df.empty:
        return df

    # drop junk + time cols
    df = df.drop(columns=DROP_COMMON + ["month", "year"], errors="ignore")

    # ensure expected columns exist (no rename needed if already correct)
    # ndvi, savi, evi, ndwi, bsi, msi, gndvi, etc.

    df = _finalize_ts(df)
    _save(df, "satellite")
    return df


# =========================
# WEATHER (ERA5 DAILY_AGGR)
# =========================


def normalize_weather():
    df = _read_all(str(RAW_DIR / "weather" / "*.csv"))
    if df.empty:
        return df

    df = df.drop(columns=DROP_COMMON + ["month", "year"], errors="ignore")

    # rename to clean schema
    df = df.rename(
        columns={
            "temperature_2m": "temperature",
            "total_precipitation_sum": "rain",
            "dewpoint_temperature_2m": "dewpoint",
            "surface_solar_radiation_downwards_sum": "solar_radiation",
            "volumetric_soil_water_layer_1": "soil_moisture_1_era5",
            "volumetric_soil_water_layer_2": "soil_moisture_2_era5",
        }
    )

    # unit conversions
    if "temperature" in df.columns:
        df["temperature"] = df["temperature"] - 273.15  # K → °C
    if "rain" in df.columns:
        df["rain"] = df["rain"] * 1000  # m → mm

    df = _finalize_ts(df)
    _save(df, "weather")
    return df


# =========================
# SMAP (SPL4SMGP)
# =========================


def normalize_smap():
    df = _read_all(str(RAW_DIR / "smap" / "*.csv"))
    if df.empty:
        return df

    df = df.drop(columns=DROP_COMMON + ["month", "year"], errors="ignore")

    # rename for clarity + avoid collision with ERA5
    df = df.rename(
        columns={
            "sm_surface": "soil_moisture_surface_smap",
            "sm_rootzone": "soil_moisture_root_smap",
            # if you used old names, handle both:
            "ssm": "soil_moisture_surface_smap",
            "susm": "soil_moisture_root_smap",
        }
    )

    df = _finalize_ts(df)
    _save(df, "smap")
    return df


# =========================
# ET (MODIS)
# =========================


def normalize_et():
    df = _read_all(str(RAW_DIR / "et" / "*.csv"))
    if df.empty:
        return df

    df = df.drop(columns=DROP_COMMON + ["month", "year"], errors="ignore")

    # 'mean' → et
    if "mean" in df.columns:
        df = df.rename(columns={"mean": "et"})

    # MODIS ET often scaled (check if needed)
    # If values look too large, uncomment:
    # df["et"] = df["et"] * 0.1

    df = _finalize_ts(df)
    _save(df, "et")
    return df


# =========================
# SOIL (STATIC)
# =========================


def normalize_soil():
    df = _read_all(str(RAW_DIR / "soil" / "*.csv"))
    if df.empty:
        return df

    df = df.drop(columns=DROP_COMMON, errors="ignore")

    # clean duplicated prefixes
    clean_cols = []
    for c in df.columns:
        nc = (
            c.replace("phh2o_phh2o", "ph_")
            .replace("clay_clay", "clay_")
            .replace("sand_sand", "sand_")
            .replace("silt_silt", "silt_")
            .replace("soc_soc", "soc_")
        )
        clean_cols.append(nc)
    df.columns = clean_cols

    df = df.dropna(subset=["cell_id"]).drop_duplicates(["cell_id"])
    _save(df, "soil")
    return df


# =========================
# CROP MAP (STATIC)
# =========================


def normalize_crop():
    df = _read_all(str(RAW_DIR / "crop" / "*.csv"))
    if df.empty:
        return df

    df = df.drop(columns=DROP_COMMON, errors="ignore")

    # mode → crop_type
    if "mode" in df.columns:
        df = df.rename(columns={"mode": "crop_type"})

    # optional binary flag
    if "crop_type" in df.columns:
        df["is_crop"] = (df["crop_type"] == 40).astype("int8")

    df = df.dropna(subset=["cell_id"]).drop_duplicates(["cell_id"])
    _save(df, "crop")
    return df


# =========================
# FINAL MERGE
# =========================


def build_master():
    print("\nBuilding master dataset...")

    # read processed (if not in memory)
    def _r(name):
        p = OUT_DIR / f"{name}.parquet"
        if p.exists():
            return pd.read_parquet(p)
        print(f"Missing {p}, skipping")
        return None

    sat = _r("satellite")
    weather = _r("weather")
    smap = _r("smap")
    et = _r("et")
    soil = _r("soil")
    crop = _r("crop")

    # time-series joins
    df = sat.copy() if sat is not None else None

    def _merge_ts(left, right):
        if left is None:
            return right
        if right is None:
            return left
        return left.merge(right, on=["cell_id", "date"], how="left")

    df = _merge_ts(df, weather)
    df = _merge_ts(df, smap)
    df = _merge_ts(df, et)

    # static joins
    if soil is not None:
        df = df.merge(soil, on="cell_id", how="left")
    if crop is not None:
        df = df.merge(crop, on="cell_id", how="left")

    # sort + fill
    df = df.sort_values(["cell_id", "date"])
    fill_cols = df.columns.difference(["cell_id"])
    df[fill_cols] = df.groupby("cell_id")[fill_cols].ffill()

    # basic sanity filter
    if "ndvi" in df.columns:
        df = df.dropna(subset=["ndvi"])

    _save(df, "final")
    return df


# =========================
# RUN
# =========================

if __name__ == "__main__":

    sat = normalize_satellite() if RUN_SATELLITE else None
    wea = normalize_weather() if RUN_WEATHER else None
    smp = normalize_smap() if RUN_SMAP else None
    et = normalize_et() if RUN_ET else None
    sol = normalize_soil() if RUN_SOIL else None
    crp = normalize_crop() if RUN_CROP else None

    if RUN_FINAL_MERGE:
        build_master()

    print("\nDone.")
