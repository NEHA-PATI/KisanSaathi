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
      className="w-full overflow-hidden rounded-lg border border-emerald-950/10 bg-[#071711] p-3 text-white shadow-2xl shadow-black/35"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Boundary Capture
          </p>
          <p className="text-sm text-slate-400">{drawPoints.length} precision points placed</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDrawing(false);
            clearDrawPoints();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label="Exit draw mode"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-white/10 bg-slate-950/28 p-2">
        {drawPoints.length === 0 ? (
          <div className="rounded-md border border-dashed border-yellow-200/35 bg-yellow-200/8 p-3 text-xs text-slate-300">
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
                  selected
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-950/20"
                    : "bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
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
                  className="flex h-7 w-7 items-center justify-center rounded-md text-rose-200 hover:bg-rose-400/15"
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
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Done
        </button>
        <button
          type="button"
          onClick={runAnalyze}
          disabled={!drawnGeometry || isAnalyzing}
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-300 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyze
        </button>
      </div>

      <button
        type="button"
        onClick={() => setSaveModalOpen(true)}
        disabled={!drawnGeometry}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-300 to-yellow-200 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Save className="h-4 w-4" />
        Save Land
      </button>
    </motion.section>
  );
});

export default DrawPointsPanel;
