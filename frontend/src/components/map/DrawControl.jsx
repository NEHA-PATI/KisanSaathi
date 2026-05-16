import { memo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";

import { useMapStore } from "@/store/useMapStore";

const pointIcon = (index, selected) =>
  L.divIcon({
    className: "",
    html: `<div class="bhoomi-draw-point ${
      selected ? "bhoomi-draw-point-selected" : ""
    }">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const pointsToGeometry = (points) => {
  if (points.length < 3) return null;

  const ring = points.map((point) => [point.lng, point.lat]);
  ring.push([points[0].lng, points[0].lat]);

  return {
    type: "Polygon",
    coordinates: [ring],
  };
};

const DrawControl = memo(function DrawControl({ map }) {
  const drawLayerRef = useRef(null);
  const polygonRef = useRef(null);
  const drawPoints = useMapStore((state) => state.drawPoints);
  const selectedPointIndex = useMapStore((state) => state.selectedPointIndex);
  const addDrawPoint = useMapStore((state) => state.addDrawPoint);
  const setSelectedPointIndex = useMapStore((state) => state.setSelectedPointIndex);
  const setDrawnGeometry = useMapStore((state) => state.setDrawnGeometry);
  const setDrawPointsFromLatLngs = useMapStore((state) => state.setDrawPointsFromLatLngs);

  useEffect(() => {
    if (!map || drawLayerRef.current) return;

    drawLayerRef.current = new L.FeatureGroup();
    map.addLayer(drawLayerRef.current);

    return () => {
      drawLayerRef.current?.remove();
      drawLayerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!map) return undefined;

    const handleClick = (event) => {
      if (!useMapStore.getState().isDrawing) return;
      addDrawPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [addDrawPoint, map]);

  useEffect(() => {
    if (!drawLayerRef.current) return;

    drawLayerRef.current.clearLayers();
    polygonRef.current = null;

    if (drawPoints.length >= 2) {
      L.polyline(
        drawPoints.map((point) => [point.lat, point.lng]),
        {
          color: "#F97316",
          weight: 4,
          dashArray: drawPoints.length < 3 ? "2 10" : "10 8",
          lineCap: "round",
          lineJoin: "round",
          opacity: 0.95,
          className: "bhoomi-draw-line",
        }
      ).addTo(drawLayerRef.current);
    }

    const geometry = pointsToGeometry(drawPoints);
    if (geometry) {
      const polygon = L.polygon(
        drawPoints.map((point) => [point.lat, point.lng]),
        {
          color: "#FF3B30",
          fillColor: "#24D6A4",
          fillOpacity: 0.12,
          weight: 4,
          dashArray: "10 8 2 8",
          lineCap: "round",
          lineJoin: "round",
          className: "bhoomi-drawn-polygon",
          bubblingMouseEvents: false,
        }
      );

      polygon.on("edit", () => {
        const latlngs = polygon.getLatLngs()?.[0] || [];
        setDrawPointsFromLatLngs(latlngs);
      });

      polygon.addTo(drawLayerRef.current);
      polygon.editing?.enable();
      polygonRef.current = polygon;
      setDrawnGeometry(geometry);
    } else {
      setDrawnGeometry(null);
    }

    drawPoints.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: pointIcon(index, selectedPointIndex === index),
        draggable: true,
      });
      marker.on("click", (event) => {
        event.originalEvent.stopPropagation();
        setSelectedPointIndex(index);
      });
      marker.on("dragend", (event) => {
        const latlng = event.target.getLatLng();
        const nextPoints = [...useMapStore.getState().drawPoints];
        nextPoints[index] = { lat: latlng.lat, lng: latlng.lng };
        setDrawPointsFromLatLngs(nextPoints);
      });
      marker.addTo(drawLayerRef.current);
    });
  }, [
    drawPoints,
    selectedPointIndex,
    setDrawPointsFromLatLngs,
    setDrawnGeometry,
    setSelectedPointIndex,
  ]);

  return null;
});

export default DrawControl;
