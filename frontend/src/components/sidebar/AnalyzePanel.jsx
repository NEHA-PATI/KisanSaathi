import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Droplets, ShieldCheck, Sprout } from "lucide-react";

import { useMapStore } from "@/store/useMapStore";
import { formatNumber } from "@/components/map/mapUtils";

const TrendSparkline = ({ values = [] }) => {
  const points = values.length ? values : [5.8, 6.4, 6.9, 7.2];
  const max = Math.max(...points, 10);
  const path = points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 180;
      const y = 54 - (value / max) * 46;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 180 60" className="h-16 w-full overflow-visible">
      <path d={path} fill="none" stroke="#2dd4bf" strokeWidth="3" />
      <path d={`${path} L 180 60 L 0 60 Z`} fill="rgba(45, 212, 191, 0.12)" />
    </svg>
  );
};

const AnalyzePanel = memo(function AnalyzePanel() {
  const selectedFeature = useMapStore((state) => state.selectedFeature);
  const drawnGeometry = useMapStore((state) => state.drawnGeometry);
  const analyzeResult = useMapStore((state) => state.analyzeResult);
  const error = useMapStore((state) => state.error);

  const selected = selectedFeature?.properties;
  const avgHealth =
    analyzeResult?.avg_health ??
    analyzeResult?.avgHealth ??
    selected?.health_score ??
    null;
  const irrigationNeedPct =
    analyzeResult?.irrigation_need_pct ?? selected?.irrigation_need_pct ?? null;
  const panelOpen = Boolean(selected || drawnGeometry || analyzeResult);

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 36 }}
          transition={{ type: "spring", stiffness: 190, damping: 24 }}
          className="absolute right-4 top-4 z-[520] max-h-[calc(100vh-2rem)] w-[340px] overflow-hidden rounded-lg border border-emerald-900/10 bg-white text-slate-900 shadow-2xl shadow-emerald-950/15"
        >
          <div className="border-b border-emerald-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A9E6E]">
              Prediction Sidebar
            </p>
            <h2 className="mt-2 text-2xl font-bold">Land Intelligence</h2>
            <p className="mt-1 text-sm text-slate-500">
              Spatial signals from the visible MaatiTrace prediction grid.
            </p>
          </div>

          <div className="space-y-3 p-4">
            {error && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {error}
              </div>
            )}

            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Average Health
                </span>
                <span className="text-3xl font-bold">
                  {formatNumber(avgHealth)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                  style={{ width: `${Math.min((avgHealth || 0) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 p-3">
                <Activity className="mb-2 h-4 w-4 text-teal-300" />
                <p className="text-xs text-slate-500">Risk</p>
                <p className="font-semibold">
                  {analyzeResult?.risk ?? (selected?.risk_flag ? "Watch" : "Safe")}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3">
                <Droplets className="mb-2 h-4 w-4 text-sky-300" />
                <p className="text-xs text-slate-500">Irrigation</p>
                <p className="font-semibold">
                  {irrigationNeedPct == null
                    ? selected?.irrigation_needed
                      ? "Needed"
                      : "Stable"
                    : `${Math.round(irrigationNeedPct)}% needed`}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sprout className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold">Mini Trend</p>
              </div>
              <TrendSparkline values={analyzeResult?.trend} />
            </div>

            <div className="rounded-lg bg-[#1A9E6E]/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#1A9E6E]">
                Advice
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {analyzeResult?.irrigation_advice ??
                  "Draw a land polygon and run analysis to receive aggregated irrigation guidance."}
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
});

export default AnalyzePanel;
