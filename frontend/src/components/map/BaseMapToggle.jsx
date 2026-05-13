import { memo, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Map, Mountain, Satellite } from "lucide-react";

const VIEWS = {
  satellite: {
    label: "Satellite",
    icon: Satellite,
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri, Earthstar Geographics, and contributors",
    labels:
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  },
  terrain: {
    label: "Terrain",
    icon: Mountain,
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data &copy; OpenStreetMap contributors, SRTM | OpenTopoMap",
  },
  standard: {
    label: "Standard",
    icon: Map,
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
};

const BaseMapToggle = memo(function BaseMapToggle({ map, compact = false }) {
  const [activeView, setActiveView] = useState("satellite");
  const baseLayerRef = useRef(null);
  const labelLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const view = VIEWS[activeView];
    baseLayerRef.current?.remove();
    labelLayerRef.current?.remove();

    baseLayerRef.current = L.tileLayer(view.url, {
      attribution: view.attribution,
      maxZoom: activeView === "terrain" ? 17 : 19,
    }).addTo(map);

    if (view.labels) {
      labelLayerRef.current = L.tileLayer(view.labels, {
        attribution: "",
        maxZoom: 19,
        pane: "tilePane",
      }).addTo(map);
    }

    return () => {
      baseLayerRef.current?.remove();
      labelLayerRef.current?.remove();
    };
  }, [activeView, map]);

  return (
    <section className={`rounded-lg border border-emerald-100 bg-white/90 p-3 text-slate-900 shadow-xl shadow-emerald-950/10 backdrop-blur-xl ${compact ? "sr-only" : ""}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1A9E6E]">
        Map View
      </p>
      <div className="grid grid-cols-3 gap-1">
        {Object.entries(VIEWS).map(([key, view]) => {
          const Icon = view.icon;
          const selected = activeView === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              className={`flex h-16 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold transition ${
                selected ? "bg-[#1A9E6E] text-white" : "bg-emerald-50 text-slate-700 hover:bg-emerald-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {view.label}
            </button>
          );
        })}
      </div>
    </section>
  );
});

export default BaseMapToggle;
