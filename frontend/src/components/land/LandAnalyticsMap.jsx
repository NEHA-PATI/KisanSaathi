import { memo, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MIN_LABEL_ZOOM = 9;

const coverageTone = (coveragePct) => {
  if (coveragePct >= 99.5) {
    return {
      fillColor: "#16A34A",
      fillOpacity: 0.12,
    };
  }
  if (coveragePct >= 50) {
    return {
      fillColor: "#24D6A4",
      fillOpacity: 0.2,
    };
  }
  return {
    fillColor: "#FFD60A",
    fillOpacity: 0.26,
  };
};

const overlapFeature = (cell) => ({
  type: "Feature",
  geometry: cell.geometry,
  properties: cell,
});

const coveredFeature = (cell) => ({
  type: "Feature",
  geometry: cell.covered_geometry,
  properties: cell,
});

const isPartialCoverage = (cell) => {
  const coveragePct = Number(cell?.coverage_pct || 0);
  return coveragePct > 0.05 && coveragePct < 99.5;
};

const cellCenter = (cell) => {
  if (cell.centroid?.lat != null && cell.centroid?.lon != null) {
    return [cell.centroid.lat, cell.centroid.lon];
  }

  const coords = cell.geometry?.coordinates?.[0] || [];
  const lats = coords.map((point) => point[1]);
  const lons = coords.map((point) => point[0]);
  if (!lats.length || !lons.length) return null;
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lons) + Math.max(...lons)) / 2,
  ];
};

const coverageLabelIcon = (coveragePct) =>
  L.divIcon({
    className: "bhoomi-partial-label",
    html: `<span>${Number(coveragePct).toFixed(0)}%</span>`,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });

const gridTooltip = (props) => {
  const coverage = Number(props.coverage_pct || 0).toFixed(1);
  return `${coverage}% covered`;
};

const gridPopup = (props) => {
  const coverage = Number(props.coverage_pct || 0).toFixed(1);
  const health = Number(props.health_score || 0).toFixed(1);
  const greenness = Number(props.crop_greenness || 0).toFixed(2);
  const wetness = Number(props.soil_wetness || 0).toFixed(2);
  const waterNeed = Number(props.water_need || 0).toFixed(0);
  const risk = Number(props.risk_score || 0) >= 0.5 ? "High" : "Low";

  return `
    <div class="bhoomi-grid-popup">
      <div class="bhoomi-grid-popup__header">
        <div>
          <span class="bhoomi-grid-popup__badge">Grid ${props.cell_id}</span>
          <strong>${coverage}% covered</strong>
        </div>
        <span class="bhoomi-grid-popup__level ${risk === "High" ? "is-high" : "is-low"}">${risk} risk</span>
      </div>
      <div class="bhoomi-grid-popup__meter">
        <i style="width:${Math.min(Number(coverage), 100)}%"></i>
      </div>
      <div class="bhoomi-grid-popup__summary">
        <div>
          <span>Health</span>
          <strong>${health}</strong>
        </div>
        <div>
          <span>Greenness</span>
          <strong>${greenness}</strong>
        </div>
        <div>
          <span>Wetness</span>
          <strong>${wetness}</strong>
        </div>
        <div>
          <span>Water Need</span>
          <strong>${waterNeed}%</strong>
        </div>
      </div>
    </div>
  `;
};

const LandAnalyticsMap = memo(function LandAnalyticsMap({ geometry, overlaps = [] }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const landLayerRef = useRef(null);
  const landGlowLayerRef = useRef(null);
  const coveredLayerRef = useRef(null);
  const overlapLayerRef = useRef(null);
  const labelLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const debugControlRef = useRef(null);

  const updateLabelScale = () => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const zoom = map.getZoom();
    const scale = Math.max(0.72, Math.min(1.7, 0.72 + (zoom - MIN_LABEL_ZOOM) * 0.16));
    container.style.setProperty("--bhoomi-label-scale", String(scale));
    container.classList.toggle("bhoomi-hide-partial-labels", zoom < MIN_LABEL_ZOOM);
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      renderer: L.svg({ padding: 0.35 }),
      attributionControl: false,
    });

    map.createPane("bhoomi-covered-pane");
    map.createPane("bhoomi-grid-pane");
    map.createPane("bhoomi-parcel-pane");
    map.getPane("bhoomi-covered-pane").style.zIndex = 430;
    map.getPane("bhoomi-grid-pane").style.zIndex = 440;
    map.getPane("bhoomi-parcel-pane").style.zIndex = 455;

    tileLayerRef.current = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const debugControl = L.control({ position: "topleft" });
    debugControl.onAdd = () => {
      const node = L.DomUtil.create("div", "bhoomi-map-debug");
      node.textContent = "0 covered grids";
      return node;
    };
    debugControl.addTo(map);
    debugControlRef.current = debugControl;

    labelLayerRef.current = L.layerGroup().addTo(map);

    coveredLayerRef.current = L.geoJSON(null, {
      interactive: false,
      pane: "bhoomi-covered-pane",
      style: (feature) => {
        const coveragePct = Number(feature?.properties?.coverage_pct || 0);
        const tone = coverageTone(coveragePct);
        return {
          ...tone,
          color: tone.fillColor,
          opacity: 0.35,
          weight: 0,
          className: "bhoomi-covered-cell",
        };
      },
    }).addTo(map);

    overlapLayerRef.current = L.geoJSON(null, {
      interactive: true,
      pane: "bhoomi-grid-pane",
      style: {
        color: "#10130F",
        fill: false,
        fillOpacity: 0,
        opacity: 0.92,
        weight: 1.8,
        className: "bhoomi-grid-cell",
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        layer.bindPopup(gridPopup(props), {
          closeButton: false,
          className: "bhoomi-grid-popup-shell",
          maxWidth: 240,
          offset: [0, -6],
        });
        layer.bindTooltip(gridTooltip(props), {
          sticky: true,
          direction: "top",
          className: "bhoomi-grid-hover-tooltip",
          opacity: 0.96,
        });
        layer.on({
          mouseover: (event) => {
            map.getContainer().style.cursor = "pointer";
            event.target.setStyle({
              color: "#070707",
              fill: true,
              fillColor: "#F7C948",
              fillOpacity: 0.16,
              opacity: 1,
              weight: 3.1,
              className: "bhoomi-grid-cell bhoomi-grid-cell-hover",
            });
          },
          mouseout: (event) => {
            map.getContainer().style.cursor = "";
            overlapLayerRef.current?.resetStyle(event.target);
          },
        });
      },
    }).addTo(map);

    landGlowLayerRef.current = L.geoJSON(null, {
      pane: "bhoomi-parcel-pane",
      interactive: false,
      style: {
        color: "#FFF7ED",
        fill: false,
        fillOpacity: 0,
        opacity: 0.8,
        weight: 7,
        dashArray: "3 10",
        lineCap: "round",
        lineJoin: "round",
        className: "bhoomi-drawn-polygon-glow",
      },
    }).addTo(map);

    landLayerRef.current = L.geoJSON(null, {
      pane: "bhoomi-parcel-pane",
      style: {
        color: "#FF3B30",
        fill: false,
        fillOpacity: 0,
        opacity: 1,
        weight: 4.4,
        dashArray: "10 8 2 8",
        lineCap: "round",
        lineJoin: "round",
        className: "bhoomi-drawn-polygon",
      },
    }).addTo(map);

    mapRef.current = map;
    map.on("zoom zoomend", updateLabelScale);
    updateLabelScale();

    return () => {
      map.off("zoom zoomend", updateLabelScale);
      map.remove();
      mapRef.current = null;
      landLayerRef.current = null;
      landGlowLayerRef.current = null;
      coveredLayerRef.current = null;
      overlapLayerRef.current = null;
      labelLayerRef.current = null;
      tileLayerRef.current = null;
      debugControlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!geometry || !mapRef.current || !landLayerRef.current) return;

    landGlowLayerRef.current?.clearLayers();
    landGlowLayerRef.current?.addData({ type: "Feature", geometry, properties: {} });
    landLayerRef.current.clearLayers();
    landLayerRef.current.addData({ type: "Feature", geometry, properties: {} });
    const bounds = landLayerRef.current.getBounds();
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds.pad(0.35), { animate: true, duration: 0.6 });
    }
  }, [geometry]);

  useEffect(() => {
    if (
      !mapRef.current ||
      !overlapLayerRef.current ||
      !coveredLayerRef.current ||
      !labelLayerRef.current
    ) {
      return;
    }

    coveredLayerRef.current.clearLayers();
    overlapLayerRef.current.clearLayers();
    labelLayerRef.current.clearLayers();
    coveredLayerRef.current.addData(
      overlaps
        .filter((cell) => cell.covered_geometry)
        .map(coveredFeature)
    );
    overlapLayerRef.current.addData(
      overlaps
        .filter((cell) => cell.geometry)
        .map(overlapFeature)
    );

    overlaps.filter(isPartialCoverage).forEach((cell) => {
      const center = cellCenter(cell);
      if (!center) return;
      L.marker(center, {
        interactive: false,
        keyboard: false,
        icon: coverageLabelIcon(cell.coverage_pct),
        pane: "tooltipPane",
      }).addTo(labelLayerRef.current);
    });

    const debugNode = containerRef.current?.querySelector(".bhoomi-map-debug");
    if (debugNode) {
      const partialCount = overlaps.filter(isPartialCoverage).length;
      debugNode.textContent = `${overlaps.length} grids | ${partialCount} partial`;
    }
    updateLabelScale();
  }, [overlaps]);

  return <div ref={containerRef} className="h-full min-h-[360px] w-full" />;
});

export default LandAnalyticsMap;
