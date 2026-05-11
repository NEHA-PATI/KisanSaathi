import pandas as pd
from .config import STATE_COLS, EXTRA_COLS, ROLL


def build_features(df):

    df = df.sort_values(["cell_id", "date"])
    surface_col = (
        "soil_moisture_surface_smap"
        if "soil_moisture_surface_smap" in df.columns
        else "soil_moisture_surface"
    )

    # -----------------------
    # Merge soil moisture
    # -----------------------
    df["soil_moisture"] = (
        0.5 * df["soil_moisture_1_era5"] + 0.5 * df[surface_col]
    )

    # -----------------------
    # Rain aggregation
    # -----------------------
    df["rain_30d"] = (
        df.groupby("cell_id")["rain"].rolling(ROLL).sum().reset_index(0, drop=True)
    )

    # -----------------------
    # Vegetation dynamics
    # -----------------------
    df["ndvi_diff"] = df.groupby("cell_id")["ndvi"].diff()

    df["ndvi_roll"] = (
        df.groupby("cell_id")["ndvi"].rolling(ROLL).mean().reset_index(0, drop=True)
    )

    # -----------------------
    # Water system
    # -----------------------
    df["water_stress"] = df["et"] / (df["rain_30d"] + 1e-5)

    # -----------------------
    # Energy system
    # -----------------------
    df["heat_stress"] = df["temperature"] / (df["soil_moisture"] + 1e-5)

    # -----------------------
    # Cleanup
    # -----------------------
    fill_cols = df.columns.difference(["cell_id"])
    df[fill_cols] = df.groupby("cell_id")[fill_cols].ffill()

    return df
