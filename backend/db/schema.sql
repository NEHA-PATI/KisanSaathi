CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS district_boundaries (
    district_slug text PRIMARY KEY,
    district_name text NOT NULL,
    boundary_source text,
    geom geometry(MultiPolygon, 4326) NOT NULL,
    loaded_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS district_boundaries_geom_gix
ON district_boundaries
USING gist (geom);

CREATE TABLE IF NOT EXISTS prediction_grid_cells (
    grid_id text NOT NULL,
    district_slug text NOT NULL,
    cell_id integer NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    grid_cell_size_deg double precision NOT NULL,
    geom geometry(Polygon, 4326) NOT NULL,
    centroid geometry(Point, 4326) NOT NULL,
    created_at timestamp DEFAULT now(),
    PRIMARY KEY (district_slug, cell_id)
);

ALTER TABLE prediction_grid_cells
ADD COLUMN IF NOT EXISTS grid_id text;

UPDATE prediction_grid_cells
SET grid_id = CONCAT(
    'IN_',
    REPLACE(TRIM(TRAILING '0' FROM TRIM(TRAILING '.' FROM grid_cell_size_deg::text)), '.', 'p'),
    '_',
    ROUND((lat + 90.0) / grid_cell_size_deg)::bigint,
    '_',
    ROUND((lon + 180.0) / grid_cell_size_deg)::bigint
)
WHERE grid_id IS NULL;

ALTER TABLE prediction_grid_cells
ALTER COLUMN grid_id SET NOT NULL;

DROP INDEX IF EXISTS prediction_grid_cells_grid_id_idx;
CREATE INDEX IF NOT EXISTS prediction_grid_cells_grid_id_idx
ON prediction_grid_cells (grid_id);

CREATE INDEX IF NOT EXISTS prediction_grid_cells_geom_gix
ON prediction_grid_cells
USING gist (geom);

CREATE INDEX IF NOT EXISTS prediction_grid_cells_district_idx
ON prediction_grid_cells (district_slug);

CREATE TABLE IF NOT EXISTS agri_predictions (
    grid_id text NOT NULL,
    district_slug text NOT NULL,
    cell_id integer NOT NULL,
    prediction_date date NOT NULL,
    health_score double precision,
    ndvi double precision,
    soil_moisture double precision,
    water_stress double precision,
    heat_stress double precision,
    irrigation_need_pct double precision,
    irrigation_needed integer,
    risk_flag integer,
    geom geometry(Polygon, 4326) NOT NULL,
    created_at timestamp DEFAULT now(),
    PRIMARY KEY (district_slug, cell_id, prediction_date)
);

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS grid_id text;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS district_slug text;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS prediction_date date;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS health_score double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS ndvi double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS ndvi_pred double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS soil_moisture double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS soil_moisture_pred double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS water_stress double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS heat_stress double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS irrigation_need_pct double precision;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS irrigation_needed integer;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS risk_flag integer;

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326);

ALTER TABLE agri_predictions
ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

UPDATE agri_predictions
SET district_slug = 'sambalpur'
WHERE district_slug IS NULL;

UPDATE agri_predictions
SET prediction_date = DATE '2020-01-01'
WHERE prediction_date IS NULL;

UPDATE agri_predictions ag
SET grid_id = gc.grid_id
FROM prediction_grid_cells gc
WHERE ag.grid_id IS NULL
AND ag.district_slug = gc.district_slug
AND ag.cell_id = gc.cell_id;

UPDATE agri_predictions
SET ndvi = ndvi_pred
WHERE ndvi IS NULL
AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'agri_predictions'
    AND column_name = 'ndvi_pred'
);

UPDATE agri_predictions
SET soil_moisture = soil_moisture_pred
WHERE soil_moisture IS NULL
AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'agri_predictions'
    AND column_name = 'soil_moisture_pred'
);

ALTER TABLE agri_predictions
ALTER COLUMN district_slug SET NOT NULL;

ALTER TABLE agri_predictions
ALTER COLUMN prediction_date SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS agri_predictions_unique_prediction_idx
ON agri_predictions (district_slug, cell_id, prediction_date);

DROP INDEX IF EXISTS agri_predictions_grid_date_idx;
CREATE INDEX IF NOT EXISTS agri_predictions_grid_date_idx
ON agri_predictions (grid_id, prediction_date);

CREATE INDEX IF NOT EXISTS agri_predictions_geom_gix
ON agri_predictions
USING gist (geom);

CREATE INDEX IF NOT EXISTS agri_predictions_cell_id_idx
ON agri_predictions (cell_id);

CREATE INDEX IF NOT EXISTS agri_predictions_district_date_idx
ON agri_predictions (district_slug, prediction_date);

CREATE TABLE IF NOT EXISTS farmer_land (
    land_id serial PRIMARY KEY,
    farmer_id integer NOT NULL,
    land_name text NOT NULL,
    district_slug text NOT NULL,
    geom geometry(Polygon, 4326) NOT NULL,
    area_hectares double precision,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

ALTER TABLE farmer_land
ADD COLUMN IF NOT EXISTS district_slug text;

UPDATE farmer_land
SET district_slug = 'sambalpur'
WHERE district_slug IS NULL;

ALTER TABLE farmer_land
ALTER COLUMN district_slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS farmer_land_geom_gix
ON farmer_land
USING gist (geom);

CREATE INDEX IF NOT EXISTS farmer_land_farmer_idx
ON farmer_land (farmer_id);

CREATE INDEX IF NOT EXISTS farmer_land_district_idx
ON farmer_land (district_slug);

CREATE TABLE IF NOT EXISTS land_grid_overlap (
    land_id integer NOT NULL REFERENCES farmer_land(land_id) ON DELETE CASCADE,
    grid_id text NOT NULL REFERENCES prediction_grid_cells(grid_id) ON DELETE CASCADE,
    district_slug text NOT NULL,
    cell_id integer NOT NULL,
    overlap_ratio double precision NOT NULL,
    overlap_area_m2 double precision NOT NULL,
    created_at timestamp DEFAULT now(),
    PRIMARY KEY (land_id, district_slug, cell_id),
    FOREIGN KEY (district_slug, cell_id)
        REFERENCES prediction_grid_cells(district_slug, cell_id)
        ON DELETE CASCADE
);

ALTER TABLE land_grid_overlap
ADD COLUMN IF NOT EXISTS district_slug text;

ALTER TABLE land_grid_overlap
ADD COLUMN IF NOT EXISTS grid_id text;

ALTER TABLE land_grid_overlap
ADD COLUMN IF NOT EXISTS overlap_area_m2 double precision;

UPDATE land_grid_overlap
SET district_slug = 'sambalpur'
WHERE district_slug IS NULL;

UPDATE land_grid_overlap
SET overlap_area_m2 = 0
WHERE overlap_area_m2 IS NULL;

UPDATE land_grid_overlap lgo
SET grid_id = gc.grid_id
FROM prediction_grid_cells gc
WHERE lgo.grid_id IS NULL
AND lgo.district_slug = gc.district_slug
AND lgo.cell_id = gc.cell_id;

ALTER TABLE land_grid_overlap
ALTER COLUMN district_slug SET NOT NULL;

ALTER TABLE land_grid_overlap
ALTER COLUMN overlap_area_m2 SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS land_grid_overlap_unique_cell_idx
ON land_grid_overlap (land_id, district_slug, cell_id);

CREATE UNIQUE INDEX IF NOT EXISTS land_grid_overlap_unique_grid_idx
ON land_grid_overlap (land_id, grid_id)
;

CREATE INDEX IF NOT EXISTS land_grid_overlap_land_idx
ON land_grid_overlap (land_id);

CREATE INDEX IF NOT EXISTS land_grid_overlap_cell_idx
ON land_grid_overlap (district_slug, cell_id);

CREATE INDEX IF NOT EXISTS land_grid_overlap_grid_idx
ON land_grid_overlap (grid_id);

CREATE TABLE IF NOT EXISTS land_snapshots (
    snapshot_id serial PRIMARY KEY,
    land_id integer NOT NULL REFERENCES farmer_land(land_id) ON DELETE CASCADE,
    snapshot_date date NOT NULL,
    avg_health double precision,
    avg_ndvi double precision,
    avg_moisture double precision,
    avg_water_stress double precision,
    avg_heat_stress double precision,
    irrigation_need double precision,
    risk_score double precision,
    covered_area_m2 double precision,
    cell_count integer,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    UNIQUE (land_id, snapshot_date)
);

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS snapshot_date date;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS avg_health double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS avg_ndvi double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS avg_moisture double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS avg_water_stress double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS avg_heat_stress double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS irrigation_need double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS risk_score double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS covered_area_m2 double precision;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS cell_count integer;

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();

ALTER TABLE land_snapshots
ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

UPDATE land_snapshots
SET cell_count = 0
WHERE cell_count IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS land_snapshots_unique_land_date_idx
ON land_snapshots (land_id, snapshot_date);

CREATE INDEX IF NOT EXISTS land_snapshots_land_date_idx
ON land_snapshots (land_id, snapshot_date);
