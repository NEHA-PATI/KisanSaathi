import { memo } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, MapPin, Save, Sparkles, Trash2, X } from "lucide-react";

import { analyzePolygon } from "@/api/mapApi";
import { useMapStore } from "@/store/useMapStore";
import { analyzeVisibleFallback } from "@/components/land/landMetrics";

const DrawPointsPanel = memo(function DrawPointsPanel() {
  const isDrawing = useMapStore((state) => state.isDrawing);
  const drawPoints = useMapStore((state) => state.drawPoints);
  const selectedPointIndex = useMapStore((state) => state.selectedPointIndex);
  const drawnGeometry = useMapStore((state) => state.drawnGeometry);
  const isAnalyzing = useMapStore((state) => state.isAnalyzing);
  const polygons = useMapStore((state) => state.polygons);
  const removeDrawPoint = useMapStore((state) => state.removeDrawPoint);
  const setDrawing = useMapStore((state) => state.setDrawing);
  const setSelectedPointIndex = useMapStore((state) => state.setSelectedPointIndex);
  const clearDrawPoints = useMapStore((state) => state.clearDrawPoints);
  const setAnalyzeResult = useMapStore((state) => state.setAnalyzeResult);
  const setAnalyzing = useMapStore((state) => state.setAnalyzing);
  const setSaveModalOpen = useMapStore((state) => state.setSaveModalOpen);
  const setError = useMapStore((state) => state.setError);

  if (!isDrawing && drawPoints.length === 0) return null;

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

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-lg border border-emerald-100 bg-white/92 p-3 text-slate-900 shadow-2xl shadow-emerald-950/15 backdrop-blur-2xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1A9E6E]">
            Draw Mode
          </p>
          <p className="text-sm text-slate-500">{drawPoints.length} boundary points</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDrawing(false);
            clearDrawPoints();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-emerald-50 hover:text-slate-900"
          aria-label="Exit draw mode"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-emerald-100 bg-emerald-50/60 p-2">
        {drawPoints.length === 0 ? (
          <div className="rounded-md border border-dashed border-emerald-300 bg-white/75 p-3 text-xs text-slate-600">
            Click field corners on the map.
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
                  selected ? "bg-[#1A9E6E] text-white" : "bg-white text-slate-700 hover:bg-emerald-100"
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
                  className="flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-50"
                  aria-label={`Delete point ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDrawing(false)}
          disabled={drawPoints.length < 3}
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-100 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Done
        </button>
        <button
          type="button"
          onClick={runAnalyze}
          disabled={!drawnGeometry || isAnalyzing}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyze
        </button>
      </div>

      <button
        type="button"
        onClick={() => setSaveModalOpen(true)}
        disabled={!drawnGeometry}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#1A9E6E] text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save className="h-4 w-4" />
        Save Land
      </button>
    </motion.section>
  );
});

export default DrawPointsPanel;
