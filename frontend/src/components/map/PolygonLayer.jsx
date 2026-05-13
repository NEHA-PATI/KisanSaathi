import { memo, useEffect, useRef } from "react";
import L from "leaflet";

import { useMapStore } from "@/store/useMapStore";
import { polygonStyle } from "./mapUtils";

const PolygonLayer = memo(function PolygonLayer({ map }) {
  const layerRef = useRef(null);
  const activeLayerRef = useRef("health");
  const hoverRafRef = useRef(null);
  const pendingHoverRef = useRef(null);
  const polygons = useMapStore((state) => state.polygons);
  const activeLayer = useMapStore((state) => state.activeLayer);
  const setHoveredFeature = useMapStore((state) => state.setHoveredFeature);
  const setSelectedFeature = useMapStore((state) => state.setSelectedFeature);
  const addDrawPoint = useMapStore((state) => state.addDrawPoint);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    if (!map || layerRef.current) return;

    const scheduleHover = (feature, event) => {
      pendingHoverRef.current = {
        feature,
        position: {
          x: event.originalEvent.clientX,
          y: event.originalEvent.clientY,
        },
      };

      if (hoverRafRef.current) return;
      hoverRafRef.current = requestAnimationFrame(() => {
        const pending = pendingHoverRef.current;
        if (pending) {
          setHoveredFeature(pending.feature, pending.position);
        }
        hoverRafRef.current = null;
      });
    };

    layerRef.current = L.geoJSON(null, {
      interactive: true,
      bubblingMouseEvents: false,
      style: (feature) => polygonStyle(feature, activeLayerRef.current),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (event) => {
            event.target.setStyle({ weight: 1.8, fillOpacity: 0.58 });
            scheduleHover(feature, event);
          },
          mousemove: (event) => {
            scheduleHover(feature, event);
          },
          mouseout: (event) => {
            layerRef.current?.resetStyle(event.target);
            pendingHoverRef.current = null;
            setHoveredFeature(null);
          },
          click: (event) => {
            if (useMapStore.getState().isDrawing) {
              addDrawPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
              return;
            }
            setSelectedFeature(feature);
          },
        });
      },
    }).addTo(map);

    return () => {
      if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
      layerRef.current?.remove();
      layerRef.current = null;
    };
  }, [addDrawPoint, map, setHoveredFeature, setSelectedFeature]);

  useEffect(() => {
    if (!layerRef.current || !polygons) return;

    // Reuse one Leaflet GeoJSON layer and only swap visible bbox features.
    layerRef.current.clearLayers();
    layerRef.current.addData(polygons);
  }, [polygons]);

  useEffect(() => {
    if (!layerRef.current) return;

    // Layer toggles restyle the existing paths instead of remounting polygons.
    layerRef.current.setStyle((feature) => polygonStyle(feature, activeLayer));
  }, [activeLayer]);

  return null;
});

export default PolygonLayer;
