import { memo } from "react";

const legendItems = [
  { label: "Healthy", color: "#25d366" },
  { label: "Watch", color: "#facc15" },
  { label: "Critical", color: "#ef4444" },
];

const MapLegend = memo(function MapLegend() {
  return (
    <div className="absolute bottom-6 right-4 z-[500] w-[190px] rounded-lg border border-white/10 bg-slate-950/55 p-3 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
        Health Legend
      </p>
      <div className="space-y-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-200">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-yellow-300 to-emerald-400" />
    </div>
  );
});

export default MapLegend;
