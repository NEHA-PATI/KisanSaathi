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
          color: "#0f766e",
          weight: 3,
          dashArray: drawPoints.length < 3 ? "6 8" : undefined,
          opacity: 0.9,
        }
      ).addTo(drawLayerRef.current);
    }

    const geometry = pointsToGeometry(drawPoints);
    if (geometry) {
      const polygon = L.polygon(
        drawPoints.map((point) => [point.lat, point.lng]),
        {
          color: "#14b8a6",
          fillColor: "#14b8a6",
          fillOpacity: 0.22,
          weight: 3,
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
