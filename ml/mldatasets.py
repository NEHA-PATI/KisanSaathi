import pandas as pd
from .config import STATE_COLS, LAGS, TARGET_HORIZON


def build_dataset(df):

    df = df.sort_values(["cell_id", "date"])

    cols = STATE_COLS + ["soil_moisture", "rain_30d"]

    # -----------------------
    # LAGS
    # -----------------------
    for lag in LAGS:
        for c in cols:
            df[f"{c}_lag{lag}"] = df.groupby("cell_id")[c].shift(lag)

    # -----------------------
    # TARGETS (t+1)
    # -----------------------
    for c in cols:
        df[f"{c}_t1"] = df.groupby("cell_id")[c].shift(-TARGET_HORIZON)

    # -----------------------
    # Drop NA rows
    # -----------------------
    df = df.dropna()

    feature_cols = [c for c in df.columns if "lag" in c]
    target_cols = [c for c in df.columns if "_t1" in c]

    return df, feature_cols, target_cols
