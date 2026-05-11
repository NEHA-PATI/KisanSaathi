import { memo, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import debounce from "lodash.debounce";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

import { fetchFarmerProfile, fetchPolygonsByBbox } from "@/api/mapApi";
import { useMapStore } from "@/store/useMapStore";
import DrawControl from "./DrawControl";
import HoverCard from "./HoverCard";
import LayerToggle from "./LayerToggle";
import MapLegend from "./MapLegend";
import PolygonLayer from "./PolygonLayer";
import BaseMapToggle from "./BaseMapToggle";
import AnalyzePanel from "@/components/sidebar/AnalyzePanel";
import DrawPointsPanel from "@/components/sidebar/DrawPointsPanel";

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
  const setFarmerProfile = useMapStore((state) => state.setFarmerProfile);

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

    // moveend plus debounce prevents continuous bbox queries while panning.
    leafletMap.on("moveend zoomend", () => loadBounds(leafletMap));

    return () => {
      loadBounds.cancel();
      leafletMap.remove();
      mapRef.current = null;
    };
  }, [loadBounds]);

  useEffect(() => {
    fetchFarmerProfile()
      .then(setFarmerProfile)
      .catch(() => {});
  }, [setFarmerProfile]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#e8f4df]">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[450] h-28 bg-gradient-to-b from-emerald-950/35 to-transparent" />

      {map && (
        <>
          <PolygonLayer map={map} />
          <DrawControl map={map} />
        </>
      )}

      <div className="absolute left-4 top-4 z-[500] flex max-h-[calc(100vh-2rem)] w-[350px] flex-col gap-3 overflow-y-auto pr-1">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-white shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
            BhoomiAI
          </p>
          <h1 className="text-xl font-bold">Agricultural Intelligence Map</h1>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Sambalpur grid, farmer land drawing, and irrigation demand profile.
          </p>
        </motion.div>
        {map && <BaseMapToggle map={map} />}
        <LayerToggle />
        <DrawPointsPanel />
      </div>
      <MapLegend />
      <HoverCard />
      <AnalyzePanel />

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
            className="pointer-events-none absolute left-1/2 top-4 z-[650] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-teal-100 shadow-xl backdrop-blur-xl"
          >
            Loading visible land grid
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default BhoomiMap;
