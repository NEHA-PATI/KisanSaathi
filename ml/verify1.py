import pandas as pd

df = pd.read_parquet("final_predictions.parquet")

print(df.shape)

print(df["cell_id"].nunique())

print(df["cell_id"].value_counts().head(20))
