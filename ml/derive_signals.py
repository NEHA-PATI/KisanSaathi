import pandas as pd


def derive(df):
    df["ndvi_pred"] = df["ndvi_t1"]
    df["soil_moisture_pred"] = df["soil_moisture_t1"]
    df["temp_pred"] = df["temperature_t1"]
    df["et_pred"] = df["et_t1"]
    df["rain_pred"] = df["rain_30d_t1"]

    df["water_stress"] = df["et_pred"] / (
        df["rain_pred"] + df["soil_moisture_pred"] + 1e-5
    )

    # Heat uses a local base range so Sambalpur cells are compared against
    # realistic district conditions instead of being flattened to zero health.
    df["heat_stress"] = df["temp_pred"] / (df["soil_moisture_pred"] + 1e-5)

    ndvi_norm = ((df["ndvi_pred"] - 0.18) / 0.5).clip(0, 1)
    water_norm = ((df["water_stress"] - 3.2) / 5.8).clip(0, 1)
    heat_norm = ((df["heat_stress"] - 185) / 160).clip(0, 1)

    health = 2.0 + 5.2 * ndvi_norm + 1.6 * (1 - water_norm) + 1.2 * (1 - heat_norm)
    df["health_score"] = health.clip(0, 10).round(2)
    df["irrigation_need_pct"] = (
        (0.62 * water_norm + 0.24 * heat_norm + 0.14 * (1 - ndvi_norm)).clip(0, 1) * 100
    ).round(1)

    df["irrigation_needed"] = (df["irrigation_need_pct"] >= 45).astype(int)
    df["risk_flag"] = (
        (df["health_score"] < 4.2) | (df["irrigation_need_pct"] >= 70)
    ).astype(int)

    return df
