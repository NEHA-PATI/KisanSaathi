import { memo } from "react";
import { motion } from "framer-motion";
import { Droplets, Flame, Leaf, ShieldCheck, Sprout } from "lucide-react";

import { useMapStore } from "@/store/useMapStore";

const layerOptions = [
  { key: "health", label: "Health Score", icon: ShieldCheck },
  { key: "ndvi", label: "NDVI", icon: Leaf },
  { key: "water", label: "Water Stress", icon: Droplets },
  { key: "heat", label: "Heat Stress", icon: Flame },
  { key: "irrigation", label: "Irrigation Need", icon: Sprout },
];

const LayerToggle = memo(function LayerToggle() {
  const activeLayer = useMapStore((state) => state.activeLayer);
  const setActiveLayer = useMapStore((state) => state.setActiveLayer);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-white/10 bg-slate-950/55 p-3 text-white shadow-xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
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
                  ? "bg-teal-300 text-slate-950"
                  : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isActive ? "bg-slate-950" : "bg-white/25"
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
