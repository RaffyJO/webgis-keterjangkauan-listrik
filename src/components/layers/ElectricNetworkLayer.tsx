import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSON } from "geojson";

import { NETWORK_CLASSES } from "../../lib/config";
import { useMapStore } from "../../store/useMapStore";
import { useMap } from "./useMap";
import {
  ensureLayer,
  setLayerVisibility,
  upsertGeoJsonSource,
} from "./syncHelpers";

/**
 * Layer jaringan listrik, satu source + layer line per kelas tegangan.
 * Warna berbeda per kelas, sesuai `NETWORK_CLASSES` di config.
 */
export default function ElectricNetworkLayer() {
  const map = useMap();
  const processed = useMapStore((s) => s.processed);
  const masterVisible = useMapStore((s) => s.visibility.network);
  const classVisible = useMapStore((s) => s.networkClassVisible);

  useEffect(() => {
    if (!map || !processed) return;
    for (const cls of NETWORK_CLASSES) {
      const fc =
        processed.networkByClass[cls.id] ?? { type: "FeatureCollection", features: [] };
      upsertGeoJsonSource(map, `network-${cls.id}`, fc as unknown as GeoJSON);
      ensureLayer(map, {
        id: `network-${cls.id}-line`,
        type: "line",
        source: `network-${cls.id}`,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": cls.color,
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
      } as unknown as maplibregl.LayerSpecification);
    }
  }, [map, processed]);

  useEffect(() => {
    if (!map) return;
    for (const cls of NETWORK_CLASSES) {
      setLayerVisibility(
        map,
        `network-${cls.id}-line`,
        masterVisible && classVisible[cls.id],
      );
    }
  }, [map, masterVisible, classVisible]);

  return null;
}