import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSON } from "geojson";

import { useMapStore } from "../../store/useMapStore";
import { useMap } from "./useMap";
import {
  ensureLayer,
  setLayerVisibility,
  upsertGeoJsonSource,
} from "./syncHelpers";

const ADMIN_CONTEXT_SOURCE = "admin-context";
const ADMIN_FOCUS_SOURCE = "admin-focus";

const ADMIN_LAYER_IDS = [
  "admin-context-line",
  "admin-focus-fill",
  "admin-focus-line",
  "admin-focus-label",
];

/**
 * Layer batas administrasi.
 * - `admin-focus-*` : fitur Kolaka Timur (area studi).
 * - `admin-context-line` : garis tipis kabupaten sekitar sebagai konteks.
 * Seluruh layer di-hide/show oleh toggle "Batas Administrasi".
 */
export default function AdministrationLayer() {
  const map = useMap();
  const processed = useMapStore((s) => s.processed);
  const visible = useMapStore((s) => s.visibility.admin);

  useEffect(() => {
    if (!map || !processed) return;

    upsertGeoJsonSource(
      map,
      ADMIN_CONTEXT_SOURCE,
      processed.adminContext as unknown as GeoJSON,
    );
    upsertGeoJsonSource(
      map,
      ADMIN_FOCUS_SOURCE,
      processed.adminKolTim as unknown as GeoJSON,
    );

    ensureLayer(map, {
      id: "admin-context-line",
      type: "line",
      source: ADMIN_CONTEXT_SOURCE,
      paint: {
        "line-color": "#94a3b8",
        "line-width": 1,
        "line-dasharray": [3, 3],
        "line-opacity": 0.6,
      },
    } as unknown as maplibregl.LayerSpecification);

    ensureLayer(map, {
      id: "admin-focus-fill",
      type: "fill",
      source: ADMIN_FOCUS_SOURCE,
      paint: {
        "fill-color": "#bfdbfe",
        "fill-opacity": 0.18,
      },
    } as unknown as maplibregl.LayerSpecification);

    ensureLayer(map, {
      id: "admin-focus-line",
      type: "line",
      source: ADMIN_FOCUS_SOURCE,
      paint: {
        "line-color": "#1d4ed8",
        "line-width": 2.5,
      },
    } as unknown as maplibregl.LayerSpecification);

    try {
      ensureLayer(map, {
        id: "admin-focus-label",
        type: "symbol",
        source: ADMIN_FOCUS_SOURCE,
        layout: {
          "text-field": ["get", "NAMOBJ"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 13,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1e3a8a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      } as unknown as maplibregl.LayerSpecification);
    } catch {
      /* font/glif tak tersedia pada style → label di-skip tanpa memecah peta */
    }
  }, [map, processed]);

  useEffect(() => {
    if (!map) return;
    for (const id of ADMIN_LAYER_IDS) setLayerVisibility(map, id, visible);
  }, [map, visible]);

  return null;
}