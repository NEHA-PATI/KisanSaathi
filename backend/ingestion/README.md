# District Ingestion

Use one run per district.

## Configure

Edit:

```text
backend/ingestion/district_config.json
```

Set `active_district` or pass `--district` at runtime. Each district writes to:

```text
data/districts/<district>/
  boundary/
  grids/
  raw/
  processed/
  logs/
```

## Prepare Only

Create the district folders, copy the boundary, and generate the grid:

```powershell
python backend/ingestion/run_district_ingestion.py --district sambalpur --skip-exports --skip-ee-wait --skip-download --skip-processing
```

## Full Pipeline

This submits all six Earth Engine exports in parallel, waits for the matching
Earth Engine tasks, downloads from Drive, normalizes, predicts, prepares DB
files, and loads PostGIS:

```powershell
python backend/ingestion/run_district_ingestion.py --district sambalpur
```

Logs are written to:

```text
data/districts/<district>/logs/
```

## Six Visible Export Terminals

If you specifically want six PowerShell windows for manual monitoring:

```powershell
python backend/ingestion/run_district_ingestion.py --district sambalpur --open-terminals
```

This only opens the export windows. After the exports finish in Earth Engine,
run the pipeline again with `--skip-exports` to continue from task waiting,
download, processing, and database load:

```powershell
python backend/ingestion/run_district_ingestion.py --district sambalpur --skip-exports
```
