import pandas as pd

df = pd.read_parquet("backend/data/processed/final_predictions.parquet")

grid = pd.read_csv("data/grids/sambalpur_grid.csv")

df = df.merge(grid[["cell_id", "lat", "lon"]], on="cell_id", how="left")

CELL = 0.01


def make_wkt(r):
    lat, lon = r["lat"], r["lon"]
    return f"POLYGON(({lon} {lat}, {lon+CELL} {lat}, {lon+CELL} {lat+CELL}, {lon} {lat+CELL}, {lon} {lat}))"


df["wkt"] = df.apply(make_wkt, axis=1)

df.to_csv("backend/data/processed/postgis_ready.csv", index=False)

print("✅ WKT file ready")
