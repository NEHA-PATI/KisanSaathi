STATE_COLS = ["ndvi", "ndwi", "msi", "temperature", "et", "solar_radiation"]

EXTRA_COLS = ["rain", "soil_moisture_1_era5", "soil_moisture_surface"]

LAGS = [1, 2, 3]  # weeks
ROLL = 4  # 4-week window
TARGET_HORIZON = 1  # t+1
