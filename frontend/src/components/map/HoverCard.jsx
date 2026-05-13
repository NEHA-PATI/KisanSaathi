import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useMapStore } from "@/store/useMapStore";
import { formatNumber, riskLabel, waterStressLabel } from "./mapUtils";

const HoverCard = memo(function HoverCard() {
  const hoveredFeature = useMapStore((state) => state.hoveredFeature);
  const hoverPosition = useMapStore((state) => state.hoverPosition);

  const properties = hoveredFeature?.properties;

  return (
    <AnimatePresence>
      {properties && hoverPosition && (
        <motion.div
          key={properties.cell_id}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          style={{
            left: Math.min(hoverPosition.x + 18, window.innerWidth - 260),
            top: Math.max(hoverPosition.y - 24, 18),
          }}
          className="pointer-events-none fixed z-[700] w-[240px] rounded-lg border border-emerald-100 bg-white/95 p-3 text-slate-900 shadow-2xl shadow-emerald-950/15 backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A9E6E]">
                Cell {properties.cell_id}
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatNumber(properties.health_score)}
                <span className="ml-1 text-sm font-medium text-slate-500">/10</span>
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
              {riskLabel(properties)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-emerald-50 p-2">
              <p className="text-slate-500">Water Stress</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {waterStressLabel(properties.water_stress)}
              </p>
            </div>
            <div className="rounded-md bg-emerald-50 p-2">
              <p className="text-slate-500">NDVI Trend</p>
              <p className="mt-0.5 font-semibold text-slate-900">Rising</p>
            </div>
            <div className="rounded-md bg-emerald-50 p-2">
              <p className="text-slate-500">Heat Stress</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {formatNumber(properties.heat_stress, 2)}
              </p>
            </div>
            <div className="rounded-md bg-emerald-50 p-2">
              <p className="text-slate-500">Irrigation</p>
              <p className="mt-0.5 font-semibold text-slate-900">
                {properties.irrigation_need_pct == null
                  ? properties.irrigation_needed
                    ? "Needed"
                    : "Stable"
                  : `${Math.round(properties.irrigation_need_pct)}%`}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default HoverCard;
