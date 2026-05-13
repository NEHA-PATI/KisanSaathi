import { memo, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import debounce from "lodash.debounce";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

import { fetchPolygonsByBbox } from "@/api/mapApi";
import { useMapStore } from "@/store/useMapStore";
import DrawControl from "./DrawControl";
import HoverCard from "./HoverCard";
import LayerToggle from "./LayerToggle";
import MapLegend from "./MapLegend";
import PolygonLayer from "./PolygonLayer";
import BaseMapToggle from "./BaseMapToggle";
import AnalyzePanel from "@/components/sidebar/AnalyzePanel";
import DrawPointsPanel from "@/components/sidebar/DrawPointsPanel";
import SaveLandModal from "@/components/land/SaveLandModal";

const GRID_CENTER = [21.5576, 84.303];

const BhoomiMap = memo(function BhoomiMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const isLoading = useMapStore((state) => state.isLoading);
  const error = useMapStore((state) => state.error);
  const setPolygons = useMapStore((state) => state.setPolygons);
  const setLoading = useMapStore((state) => state.setLoading);
  const setError = useMapStore((state) => state.setError);
  const isDrawing = useMapStore((state) => state.isDrawing);
  const drawPoints = useMapStore((state) => state.drawPoints);
  const selectedFeature = useMapStore((state) => state.selectedFeature);
  const drawnGeometry = useMapStore((state) => state.drawnGeometry);
  const analyzeResult = useMapStore((state) => state.analyzeResult);
  const setDrawing = useMapStore((state) => state.setDrawing);
  const analyticsOpen = Boolean(selectedFeature || drawnGeometry || analyzeResult);
  const showMapControls = isDrawing || drawPoints.length > 0 || analyticsOpen;

  const loadBounds = useMemo(
    () =>
      debounce(async (leafletMap) => {
        if (!leafletMap) return;

        setLoading(true);
        try {
          const data = await fetchPolygonsByBbox(leafletMap.getBounds());
          setPolygons(data);
        } catch {
          setError("Unable to load map polygons. Check the backend map API.");
        } finally {
          setLoading(false);
        }
      }, 300),
    [setError, setLoading, setPolygons]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const leafletMap = L.map(containerRef.current, {
      zoomControl: false,
      preferCanvas: true,
      renderer: L.canvas({ padding: 0.35 }),
      center: GRID_CENTER,
      zoom: 9,
      minZoom: 8,
      maxZoom: 17,
    });

    L.control.zoom({ position: "bottomright" }).addTo(leafletMap);

    mapRef.current = leafletMap;
    setMap(leafletMap);
    loadBounds(leafletMap);

    // Bbox fetching is intentionally debounced so panning never produces a query storm.
    leafletMap.on("moveend zoomend", () => loadBounds(leafletMap));

    return () => {
      loadBounds.cancel();
      leafletMap.remove();
      mapRef.current = null;
    };
  }, [loadBounds]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#F0FAF7]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[450] h-24 bg-gradient-to-b from-white/75 to-transparent" />

      {map && (
        <>
          <BaseMapToggle map={map} compact />
          <PolygonLayer map={map} />
          <DrawControl map={map} />
        </>
      )}

      <div className="absolute left-4 top-4 z-[500] w-[min(340px,calc(100vw-2rem))]">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg border border-emerald-100 bg-white/90 px-4 py-3 text-slate-900 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A9E6E]">
            BhoomiAI
          </p>
          <h1 className="text-xl font-bold">Land Map</h1>
        </motion.div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-[560] flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-3 sm:left-5 sm:translate-x-0">
        {!isDrawing && drawPoints.length === 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setError(null);
              setDrawing(true);
            }}
            className="flex h-14 items-center justify-center gap-2 rounded-full border border-[#1A9E6E]/20 bg-[#1A9E6E] px-6 text-base font-bold text-white shadow-2xl shadow-emerald-950/20 transition hover:bg-emerald-700"
          >
            <Crosshair className="h-5 w-5" />
            Draw My Land
          </motion.button>
        )}
        <DrawPointsPanel />
      </div>

      {showMapControls && !analyticsOpen && (
        <div className="absolute right-4 top-4 z-[500] hidden w-[310px] flex-col gap-3 lg:flex">
          <LayerToggle />
        </div>
      )}

      {showMapControls && (
        <div className="absolute bottom-24 right-4 z-[500] w-[min(310px,calc(100vw-2rem))] lg:hidden">
          <LayerToggle />
        </div>
      )}

      {showMapControls && <MapLegend />}
      <HoverCard />
      <AnalyzePanel />
      <SaveLandModal />

      {error && (
        <div className="absolute left-1/2 top-16 z-[650] max-w-md -translate-x-1/2 rounded-lg border border-amber-200 bg-white/95 px-4 py-3 text-sm font-medium text-amber-900 shadow-xl backdrop-blur">
          {error}
        </div>
      )}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-4 z-[650] -translate-x-1/2 rounded-full border border-emerald-100 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-800 shadow-xl backdrop-blur-xl"
          >
            Loading visible land grid
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default BhoomiMap;
