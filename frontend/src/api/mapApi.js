import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD
      ? "https://maatitrace-api.onrender.com"
      : "http://localhost:8000"),
  timeout: 20000,
});

const bboxCache = new Map();
const CACHE_TTL_MS = 60_000;

const roundCoord = (value) => Number(value).toFixed(4);

const cacheKeyFromBounds = (bounds) =>
  [
    roundCoord(bounds.getWest()),
    roundCoord(bounds.getSouth()),
    roundCoord(bounds.getEast()),
    roundCoord(bounds.getNorth()),
  ].join(":");

const asFeatureCollection = (payload) => {
  if (payload?.type === "FeatureCollection") {
    return payload;
  }

  const rows = Array.isArray(payload) ? payload : payload?.features || [];

  return {
    type: "FeatureCollection",
    features: rows
      .map((row) => {
        const geometry =
          typeof row.geometry === "string" ? JSON.parse(row.geometry) : row.geometry;

        return {
          type: "Feature",
          geometry,
          properties: {
            grid_id: row.grid_id,
            cell_id: row.cell_id,
            health_score: row.health_score,
            ndvi: row.ndvi ?? row.ndvi_pred,
            soil_moisture: row.soil_moisture,
            water_stress: row.water_stress,
            heat_stress: row.heat_stress,
            irrigation_needed: row.irrigation_needed,
            irrigation_need_pct: row.irrigation_need_pct,
            risk_flag: row.risk_flag,
          },
        };
      })
      .filter((feature) => feature.geometry),
  };
};

export const fetchPolygonsByBbox = async (bounds) => {
  const key = cacheKeyFromBounds(bounds);
  const cached = bboxCache.get(key);

  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const params = {
    minx: bounds.getWest(),
    miny: bounds.getSouth(),
    maxx: bounds.getEast(),
    maxy: bounds.getNorth(),
  };

  const { data } = await api.get("/map_bbox", { params });
  const featureCollection = asFeatureCollection(data);

  bboxCache.set(key, {
    createdAt: Date.now(),
    data: featureCollection,
  });

  return featureCollection;
};

export const fetchDistrictBoundaries = async () => {
  const { data } = await api.get("/district_boundaries");
  return data;
};

export const analyzePolygon = async (geometry) => {
  const { data } = await api.post("/analyze_polygon", { geometry });
  return data;
};

export const createLand = async ({ farmerId, landName, geometry }) => {
  const { data } = await api.post("/lands", {
    farmer_id: farmerId,
    land_name: landName,
    geometry,
  });
  return data;
};

export const fetchLand = async (landId) => {
  const { data } = await api.get(`/lands/${landId}`);
  return data;
};

export const fetchLandTrends = async (landId) => {
  const { data } = await api.get(`/lands/${landId}/trends`);
  return data;
};

export const fetchLandOverlaps = async (landId, snapshotDate) => {
  const { data } = await api.get(`/lands/${landId}/overlaps`, {
    params: snapshotDate ? { snapshot_date: snapshotDate } : undefined,
  });
  return data;
};

export const backfillLandSnapshots = async (landId, params = {}) => {
  const { data } = await api.post(`/lands/${landId}/snapshots/backfill`, null, {
    params,
  });
  return data;
};

export const clearMapApiCache = () => bboxCache.clear();
