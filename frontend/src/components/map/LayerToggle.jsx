import { memo } from "react";
import { motion } from "framer-motion";
import { Droplets, Flame, Leaf, ShieldCheck } from "lucide-react";

import { useMapStore } from "@/store/useMapStore";

const layerOptions = [
  { key: "health", label: "Health", icon: ShieldCheck },
  { key: "ndvi", label: "NDVI", icon: Leaf },
  { key: "water", label: "Water Stress", icon: Droplets },
  { key: "heat", label: "Heat Stress", icon: Flame },
];

const LayerToggle = memo(function LayerToggle() {
  const activeLayer = useMapStore((state) => state.activeLayer);
  const setActiveLayer = useMapStore((state) => state.setActiveLayer);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-emerald-100 bg-white/90 p-3 text-slate-900 shadow-xl shadow-emerald-950/10 backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1A9E6E]">
          Layers
        </p>
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_#34d399]" />
      </div>

      <div className="space-y-1">
        {layerOptions.map(({ key, label, icon: Icon }) => {
          const isActive = activeLayer === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveLayer(key)}
              className={`flex h-9 w-full items-center justify-between rounded-md px-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-[#1A9E6E] text-white"
                  : "text-slate-700 hover:bg-emerald-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isActive ? "bg-white" : "bg-emerald-200"
                }`}
              />
            </button>
          );
        })}
      </div>
    </motion.aside>
  );
});

export default LayerToggle;
