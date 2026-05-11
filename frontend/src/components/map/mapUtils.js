export const getMetricValue = (properties, layer) => {
  if (!properties) return null;

  switch (layer) {
    case "ndvi":
      return properties.ndvi ?? properties.ndvi_pred ?? properties.health_score / 10;
    case "water":
      return properties.water_stress;
    case "heat":
      return properties.heat_stress;
    case "irrigation":
      return properties.irrigation_need_pct ?? (properties.irrigation_needed ? 100 : 0);
    case "health":
    default:
      return properties.health_score;
  }
};

export const getHealthColor = (score = 0) => {
  if (score > 7.2) return "#25d366";
  if (score >= 4.2) return "#facc15";
  return "#ef4444";
};

const normalizedStress = (properties, layer, value) => {
  if (value == null || Number.isNaN(Number(value))) return null;
  if (layer === "water") return Math.max(0, Math.min(1, (Number(value) - 3.2) / 5.8));
  if (layer === "heat") return Math.max(0, Math.min(1, (Number(value) - 185) / 160));
  return Number(value);
};

export const getLayerColor = (properties, layer) => {
  const value = getMetricValue(properties, layer);

  if (layer === "health") return getHealthColor(value);
  if (layer === "irrigation") {
    if (Number(value) >= 70) return "#ef4444";
    if (Number(value) >= 45) return "#fb923c";
    return "#22c55e";
  }

  const stress = normalizedStress(properties, layer, value);
  if (stress == null) return "#94a3b8";
  if (stress > 0.75) return "#ef4444";
  if (stress > 0.45) return "#facc15";
  return "#22c55e";
};

export const polygonStyle = (feature, layer) => ({
  color: getLayerColor(feature?.properties, layer),
  weight: 1.15,
  opacity: 0.95,
  fillColor: getLayerColor(feature?.properties, layer),
  fillOpacity: 0.5,
  className: "bhoomi-polygon",
});

export const formatNumber = (value, digits = 1) => {
  if (value == null || Number.isNaN(Number(value))) return "NA";
  return Number(value).toFixed(digits);
};

export const riskLabel = (properties) => {
  if (properties?.risk_flag) return "Watch";
  if ((properties?.health_score ?? 0) < 4) return "High";
  return "Safe";
};

export const waterStressLabel = (value) => {
  if (value == null) return "Moderate";
  if (value > 0.8) return "High";
  if (value > 0.45) return "Medium";
  return "Low";
};
