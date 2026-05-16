export const previewFromGeometry = (geometry) => {
  const ring = geometry?.coordinates?.[0] || [];
  if (!ring.length) return null;

  const xs = ring.map(([lng]) => lng);
  const ys = ring.map(([, lat]) => lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX, 0.00001);
  const height = Math.max(maxY - minY, 0.00001);

  const points = ring
    .map(([lng, lat]) => {
      const x = 18 + ((lng - minX) / width) * 164;
      const y = 132 - ((lat - minY) / height) * 106;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect width="200" height="150" fill="#dff5e8"/><path d="M0 96 C42 70 82 116 200 62 L200 150 L0 150Z" fill="#b7e3c8"/><path d="M0 118 C58 88 116 134 200 90 L200 150 L0 150Z" fill="#93cfaa"/><polygon points="${points}" fill="#14b8a6" fill-opacity=".34" stroke="#047857" stroke-width="4"/><circle cx="166" cy="30" r="13" fill="#fde68a"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const analyzeVisibleFallback = (polygons) => {
  const features = polygons?.features || [];
  const scores = features
    .map((feature) => Number(feature.properties?.health_score))
    .filter((score) => !Number.isNaN(score));
  const irrigation = features
    .map((feature) => Number(feature.properties?.irrigation_need_pct))
    .filter((score) => !Number.isNaN(score));
  const ndvi = features
    .map((feature) => Number(feature.properties?.ndvi))
    .filter((score) => !Number.isNaN(score));

  const avgHealth = scores.length
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : 0;
  const irrigationNeedPct = irrigation.length
    ? irrigation.reduce((total, score) => total + score, 0) / irrigation.length
    : 0;
  const avgNdvi = ndvi.length
    ? ndvi.reduce((total, score) => total + score, 0) / ndvi.length
    : avgHealth / 10;

  return {
    avg_health: avgHealth,
    avg_ndvi: avgNdvi,
    cell_count: features.length,
    risk: avgHealth < 4 || irrigationNeedPct >= 70 ? "High" : avgHealth < 7 ? "Moderate" : "Low",
    irrigation_need_pct: irrigationNeedPct,
    irrigation_advice: `Irrigation demand is ${irrigationNeedPct.toFixed(0)}%. This estimate uses the currently visible map grid.`,
    trend: [avgHealth - 0.8, avgHealth - 0.3, avgHealth, avgHealth + 0.2].map((value) =>
      Math.max(0, Math.min(10, value))
    ),
    source: "visible-bbox-fallback",
  };
};

export const buildRecommendations = (analysis) => {
  const irrigation = Number(analysis?.water_need ?? analysis?.irrigation_need_pct ?? 0);
  const health = Number(analysis?.avg_health ?? analysis?.health ?? 0);

  if (irrigation >= 70 || health < 4) {
    return [
      "Schedule irrigation before peak afternoon heat.",
      "Inspect low-lying patches for moisture loss and crop stress.",
      "Prioritize this plot for the next field visit.",
    ];
  }

  if (irrigation >= 45 || health < 7) {
    return [
      "Keep irrigation ready for the next cycle.",
      "Track NDVI movement over the next week.",
      "Review boundary zones for uneven crop response.",
    ];
  }

  return [
    "Maintain the current irrigation cadence.",
    "Continue weekly crop health monitoring.",
    "Use this plot as a benchmark against stressed fields.",
  ];
};
