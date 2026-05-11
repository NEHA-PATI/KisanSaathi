import { memo } from "react";
import { motion } from "framer-motion";
import { Check, Crosshair, Image, Loader2, MapPin, Save, Sparkles, Trash2 } from "lucide-react";

import { analyzePolygon, saveFarmerLand } from "@/api/mapApi";
import { useMapStore } from "@/store/useMapStore";

const previewFromGeometry = (geometry) => {
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
      const x = 16 + ((lng - minX) / width) * 128;
      const y = 104 - ((lat - minY) / height) * 88;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="#dff5e8"/><path d="M0 78 C36 58 64 96 160 54 L160 120 L0 120Z" fill="#b7e3c8"/><polygon points="${points}" fill="#14b8a6" fill-opacity=".32" stroke="#047857" stroke-width="3"/><circle cx="132" cy="24" r="12" fill="#fde68a"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const analyzeVisibleFallback = (polygons) => {
  const features = polygons?.features || [];
  const scores = features
    .map((feature) => Number(feature.properties?.health_score))
    .filter((score) => !Number.isNaN(score));
  const irrigation = features
    .map((feature) => Number(feature.properties?.irrigation_need_pct))
    .filter((score) => !Number.isNaN(score));
  const avgHealth = scores.length
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : 0;
  const irrigationNeedPct = irrigation.length
    ? irrigation.reduce((total, score) => total + score, 0) / irrigation.length
    : 0;

  return {
    avg_health: avgHealth,
    risk: avgHealth < 4 ? "High" : avgHealth < 7 ? "Moderate" : "Low",
    irrigation_need_pct: irrigationNeedPct,
    irrigation_advice: `Irrigation demand is ${irrigationNeedPct.toFixed(0)}%. This is estimated from the visible map grid.`,
    trend: [avgHealth - 0.8, avgHealth - 0.3, avgHealth, avgHealth + 0.2].map(
      (value) => Math.max(0, Math.min(10, value))
    ),
    source: "visible-bbox-fallback",
  };
};

const DrawPointsPanel = memo(function DrawPointsPanel() {
  const isDrawing = useMapStore((state) => state.isDrawing);
  const drawPoints = useMapStore((state) => state.drawPoints);
  const selectedPointIndex = useMapStore((state) => state.selectedPointIndex);
  const drawnGeometry = useMapStore((state) => state.drawnGeometry);
  const analyzeResult = useMapStore((state) => state.analyzeResult);
  const isAnalyzing = useMapStore((state) => state.isAnalyzing);
  const polygons = useMapStore((state) => state.polygons);
  const farmerProfile = useMapStore((state) => state.farmerProfile);
  const removeDrawPoint = useMapStore((state) => state.removeDrawPoint);
  const setDrawing = useMapStore((state) => state.setDrawing);
  const setSelectedPointIndex = useMapStore((state) => state.setSelectedPointIndex);
  const clearDrawPoints = useMapStore((state) => state.clearDrawPoints);
  const setAnalyzeResult = useMapStore((state) => state.setAnalyzeResult);
  const setAnalyzing = useMapStore((state) => state.setAnalyzing);
  const setError = useMapStore((state) => state.setError);
  const setFarmerProfile = useMapStore((state) => state.setFarmerProfile);

  const startDrawing = () => {
    setDrawing(true);
    setError(null);
  };

  const runAnalyze = async () => {
    if (!drawnGeometry) return;
    setAnalyzing(true);
    setError(null);

    try {
      const result = await analyzePolygon(drawnGeometry);
      setAnalyzeResult(result);
    } catch {
      setAnalyzeResult(analyzeVisibleFallback(polygons));
      setError("Analyze API is unavailable, so showing a visible-map estimate.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveLand = async () => {
    if (!drawnGeometry) return;
    const previewImage = previewFromGeometry(drawnGeometry);
    const analysis = analyzeResult || analyzeVisibleFallback(polygons);

    try {
      const profile = await saveFarmerLand({ geometry: drawnGeometry, previewImage, analysis });
      setFarmerProfile(profile);
      setAnalyzeResult(analysis);
      setDrawing(false);
      setError(null);
    } catch {
      setFarmerProfile({
        ...farmerProfile,
        saved_lands: [
          {
            id: `local_${Date.now()}`,
            saved_at: Date.now(),
            geometry: drawnGeometry,
            preview_image: previewImage,
            analysis,
          },
          ...(farmerProfile?.saved_lands || []).slice(0, 4),
        ],
      });
      setError("Backend save is unavailable, so the land was saved in this session.");
    }
  };

  const latestLand = farmerProfile?.saved_lands?.[0];

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/55 p-3 text-white shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
          Farmer Land
        </p>
        <span className="text-xs text-slate-300">{drawPoints.length} points</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={startDrawing}
          className={`flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
            isDrawing ? "bg-teal-300 text-slate-950" : "bg-white/10 text-slate-100 hover:bg-white/15"
          }`}
        >
          <Crosshair className="h-4 w-4" />
          Draw
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={runAnalyze}
          disabled={!drawnGeometry || isAnalyzing}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyze
        </motion.button>
      </div>

      {isDrawing && (
        <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-md border border-white/10 bg-white/6 p-2">
          {drawPoints.length === 0 ? (
            <div className="rounded-md border border-dashed border-emerald-300/25 bg-emerald-300/8 p-3 text-xs text-slate-300">
              Click the map around the field boundary.
            </div>
          ) : (
            drawPoints.map((point, index) => {
              const selected = selectedPointIndex === index;
              return (
                <button
                  key={`${point.lat}-${point.lng}-${index}`}
                  type="button"
                  onClick={() => setSelectedPointIndex(index)}
                  className={`grid w-full grid-cols-[24px_1fr_30px] items-center gap-2 rounded-md p-2 text-left text-xs transition ${
                    selected ? "bg-teal-300 text-slate-950" : "bg-white/8 text-slate-100 hover:bg-white/12"
                  }`}
                >
                  <span className="font-bold">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-[11px] opacity-75">
                      <MapPin className="h-3 w-3" />
                      Boundary
                    </span>
                    <span className="block truncate font-mono">
                      {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeDrawPoint(index);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-rose-300 hover:bg-rose-400/10"
                    aria-label={`Delete point ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={clearDrawPoints}
          className="h-9 rounded-md border border-white/10 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => setDrawing(false)}
          disabled={drawPoints.length < 3}
          className="flex h-9 items-center justify-center gap-1 rounded-md border border-white/10 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" />
          Use
        </button>
        <button
          type="button"
          onClick={saveLand}
          disabled={!drawnGeometry}
          className="flex h-9 items-center justify-center gap-1 rounded-md bg-teal-300 text-xs font-bold text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>

      {latestLand && (
        <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-white/8">
          {latestLand.preview_image ? (
            <img src={latestLand.preview_image} alt="Saved farmer land preview" className="h-24 w-full object-cover" />
          ) : (
            <div className="flex h-24 items-center justify-center text-slate-400">
              <Image className="h-5 w-5" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 p-2 text-xs">
            <span className="text-slate-300">Saved profile</span>
            <span className="text-right font-semibold text-teal-200">
              {latestLand.analysis?.irrigation_need_pct?.toFixed?.(0) ?? "0"}% irrigation
            </span>
          </div>
        </div>
      )}
    </section>
  );
});

export default DrawPointsPanel;
