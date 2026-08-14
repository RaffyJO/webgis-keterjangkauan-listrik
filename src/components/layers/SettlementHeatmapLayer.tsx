import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { GeoJSON } from "geojson";

import { ACCESSIBILITY_CLASSES } from "../../lib/config";
import {
  buildSettlementHeatmapSource,
  HEATMAP_PAINT,
  SETTLEMENT_CIRCLE_PAINT,
} from "../../lib/heatmapUtils";
import { useMapStore } from "../../store/useMapStore";
import { useMap } from "./useMap";
import {
  ensureLayer,
  setLayerVisibility,
  upsertGeoJsonSource,
} from "./syncHelpers";

const HEATMAP_SOURCE = "settlement-heatmap";
const HEATMAP_LAYER_ID = "settlement-heatmap";
const CIRCLE_LAYER_ID = "settlement-points-circle";

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m} m`;
}

function popupHtml(props: Record<string, unknown>): string {
  const classId = String(props.accessibilityId ?? "");
  const kelas = ACCESSIBILITY_CLASSES.find((c) => c.id === classId);
  const kelasLabel = kelas ? kelas.label : classId;
  const kelasColor = kelas?.color ?? "#64748b";
  const pop = typeof props.population === "number" ? props.population : null;
  const priority = typeof props.priority === "number" ? props.priority : 0;
  return `
    <div style="font-family: inherit; font-size: 12px; line-height: 1.6;">
      <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${
        props.nama ?? "Permukiman"
      }</div>
      <div>Keterjangkauan: <b style="color:${kelasColor};">${kelasLabel}</b></div>
      <div>Jarak ke jaringan: <b>${formatDistance(Number(props.distanceM ?? 0))}</b></div>
      ${
        pop != null
          ? `<div>Jumlah penduduk: <b>${pop.toLocaleString("id-ID")}</b> jiwa</div>`
          : ""
      }
      <div>Skor prioritas: <b>${priority.toFixed(3)}</b> / 1.0</div>
    </div>
  `;
}

/**
 * Layer permukiman:
 * - `settlement-heatmap` : heatmap native MapLibre, weight = skor prioritas.
 * - `settlement-points-circle` : titik permukiman per kelas keterjangkauan
 *   (dengan popup detail saat diklik).
 */
export default function SettlementHeatmapLayer() {
  const map = useMap();
  const processed = useMapStore((s) => s.processed);
  const heatmapVisible = useMapStore((s) => s.visibility.heatmap);
  const pointsVisible = useMapStore((s) => s.visibility.settlements);

  useEffect(() => {
    if (!map || !processed || processed.settlementScores.length === 0) return;
    const source = buildSettlementHeatmapSource(processed.settlementScores);
    upsertGeoJsonSource(map, HEATMAP_SOURCE, source as unknown as GeoJSON);

    ensureLayer(map, {
      id: HEATMAP_LAYER_ID,
      type: "heatmap",
      source: HEATMAP_SOURCE,
      maxzoom: 16,
      paint: HEATMAP_PAINT,
    } as unknown as maplibregl.LayerSpecification);

    ensureLayer(map, {
      id: CIRCLE_LAYER_ID,
      type: "circle",
      source: HEATMAP_SOURCE,
      paint: SETTLEMENT_CIRCLE_PAINT,
    } as unknown as maplibregl.LayerSpecification);
  }, [map, processed]);

  useEffect(() => {
    if (!map) return;
    setLayerVisibility(map, HEATMAP_LAYER_ID, heatmapVisible);
    setLayerVisibility(map, CIRCLE_LAYER_ID, pointsVisible);
  }, [map, heatmapVisible, pointsVisible]);

  useEffect(() => {
    if (!map) return;
    const popup = new maplibregl.Popup({ closeButton: true, maxWidth: "280px" });
    const onClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature || feature.properties == null) return;
      popup.setLngLat(e.lngLat).setHTML(popupHtml(feature.properties)).addTo(map);
    };
    map.on("click", CIRCLE_LAYER_ID, onClick);
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("mouseenter", CIRCLE_LAYER_ID, onEnter);
    map.on("mouseleave", CIRCLE_LAYER_ID, onLeave);
    return () => {
      map.off("click", CIRCLE_LAYER_ID, onClick);
      map.off("mouseenter", CIRCLE_LAYER_ID, onEnter);
      map.off("mouseleave", CIRCLE_LAYER_ID, onLeave);
      popup.remove();
    };
  }, [map]);

  return null;
}