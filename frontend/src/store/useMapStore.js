import { create } from "zustand";

const defaultLayers = {
  health: true,
  ndvi: false,
  water: false,
  heat: false,
};

export const useMapStore = create((set) => ({
  activeLayer: "health",
  layers: defaultLayers,
  polygons: { type: "FeatureCollection", features: [] },
  hoveredFeature: null,
  hoverPosition: null,
  selectedFeature: null,
  isDrawing: false,
  drawPoints: [],
  selectedPointIndex: null,
  drawnGeometry: null,
  analyzeResult: null,
  saveModalOpen: false,
  isLoading: false,
  isAnalyzing: false,
  isSaving: false,
  error: null,

  setActiveLayer: (layer) =>
    set((state) => ({
      activeLayer: layer,
      layers: Object.fromEntries(
        Object.keys(state.layers).map((key) => [key, key === layer])
      ),
    })),
  setPolygons: (polygons) => set({ polygons, error: null }),
  setHoveredFeature: (hoveredFeature, hoverPosition = null) =>
    set({ hoveredFeature, hoverPosition }),
  setSelectedFeature: (selectedFeature) => set({ selectedFeature }),
  setDrawing: (isDrawing) => set({ isDrawing }),
  addDrawPoint: (point) =>
    set((state) => ({
      drawPoints: [...state.drawPoints, point],
      selectedPointIndex: state.drawPoints.length,
    })),
  removeDrawPoint: (index) =>
    set((state) => {
      const drawPoints = state.drawPoints.filter((_, pointIndex) => pointIndex !== index);
      return {
        drawPoints,
        selectedPointIndex: drawPoints.length ? Math.min(index, drawPoints.length - 1) : null,
        drawnGeometry: null,
      };
    }),
  setSelectedPointIndex: (selectedPointIndex) => set({ selectedPointIndex }),
  setDrawPointsFromLatLngs: (latlngs) =>
    set({
      drawPoints: latlngs.map((point) => ({ lat: point.lat, lng: point.lng })),
    }),
  clearDrawPoints: () =>
    set({
      drawPoints: [],
      selectedPointIndex: null,
      drawnGeometry: null,
      analyzeResult: null,
      saveModalOpen: false,
    }),
  setDrawnGeometry: (drawnGeometry) => set({ drawnGeometry, analyzeResult: null }),
  setAnalyzeResult: (analyzeResult) => set({ analyzeResult }),
  setSaveModalOpen: (saveModalOpen) => set({ saveModalOpen }),
  setLoading: (isLoading) => set({ isLoading }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
}));
