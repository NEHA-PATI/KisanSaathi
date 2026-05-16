import { memo, useEffect, useRef } from "react";
import L from "leaflet";

import { fetchDistrictBoundaries } from "@/api/mapApi";

const DistrictBoundaryLayer = memo(function DistrictBoundaryLayer({ map }) {
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map || layerRef.current) return;

        layerRef.current = L.geoJSON(null, {
            style: () => ({
                color: "#0f766e",
                weight: 2.4,
                opacity: 0.86,
                fill: false,
                dashArray: "12 8",
                lineJoin: "round",
                className: "bhoomi-district-boundary",
            }),
            onEachFeature: (feature, layer) => {
                const districtName = feature?.properties?.district_name || feature?.properties?.district_slug;
                layer.bindTooltip(districtName || "District", {
                    permanent: true,
                    direction: "center",
                    className: "bhoomi-district-label",
                    opacity: 0.95,
                    interactive: false,
                });
            },
        }).addTo(map);

        fetchDistrictBoundaries()
            .then((data) => {
                if (!layerRef.current) return;
                layerRef.current.clearLayers();
                layerRef.current.addData(data);

                const bounds = layerRef.current.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds.pad(0.08), {
                        animate: true,
                        duration: 0.9,
                        maxZoom: 10,
                    });
                }
            })
            .catch(() => {
                // Leave map working if boundaries cannot be loaded.
            });

        return () => {
            layerRef.current?.remove();
            layerRef.current = null;
        };
    }, [map]);

    return null;
});

export default DistrictBoundaryLayer;
