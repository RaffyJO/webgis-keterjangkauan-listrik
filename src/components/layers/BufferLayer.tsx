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
 * Layer buffer bertingkat per kelas tegangan (sudah di-clip ke Kolaka Timur).
 * Fill semi-transparan + outline warna kelas.
 */
export default function BufferLayer() {
  const map = useMap();
  const processed = useMapStore((s) => s.processed);
  const masterVisible = useMapStore((s) => s.visibility.buffers);
  const classVisible = useMapStore((s) => s.bufferClassVisible);

  useEffect(() => {
    if (!map || !processed) return;
    for (const cls of NETWORK_CLASSES) {
      const buffer = processed.buffersByClass[cls.id];
      if (!buffer) continue;
      upsertGeoJsonSource(map, `buffer-${cls.id}`, buffer as unknown as GeoJSON);
      ensureLayer(map, {
        id: `buffer-${cls.id}-fill`,
        type: "fill",
        source: `buffer-${cls.id}`,
        paint: {
          "fill-color": cls.color,
          "fill-opacity": 0.15,
          "fill-outline-color": cls.color,
        },
      } as unknown as maplibregl.LayerSpecification);
    }
  }, [map, processed]);

  useEffect(() => {
    if (!map) return;
    for (const cls of NETWORK_CLASSES) {
      setLayerVisibility(
        map,
        `buffer-${cls.id}-fill`,
        masterVisible && classVisible[cls.id],
      );
    }
  }, [map, masterVisible, classVisible]);

  return null;
}