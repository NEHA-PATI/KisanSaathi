import { memo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const LandAnalyticsMap = memo(function LandAnalyticsMap({ geometry }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const landLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      preferCanvas: true,
      renderer: L.canvas({ padding: 0.35 }),
      attributionControl: false,
    });

    tileLayerRef.current = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Keep one GeoJSON instance for the saved land and replace data in place.
    landLayerRef.current = L.geoJSON(null, {
      style: {
        color: "#2dd4bf",
        fillColor: "#14b8a6",
        fillOpacity: 0.24,
        weight: 4,
        className: "bhoomi-drawn-polygon",
      },
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      landLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!geometry || !mapRef.current || !landLayerRef.current) return;

    landLayerRef.current.clearLayers();
    landLayerRef.current.addData({ type: "Feature", geometry, properties: {} });
    const bounds = landLayerRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds.pad(0.35), { animate: true, duration: 0.6 });
    }
  }, [geometry]);

  return <div ref={containerRef} className="h-full min-h-[360px] w-full" />;
});

export default LandAnalyticsMap;
