import type maplibregl from "maplibre-gl";
import type { GeoJSON } from "geojson";

type GeoJsonSource = maplibregl.GeoJSONSource;

/**
 * Tambahkan source GeoJSON bila belum ada; bila sudah ada hanya update data
 * (tidak recreate) agar urutan z layer tetap stabil.
 * No-op bila style basemap belum selesai dimuat (menghindari error
 * "Style is not done loading").
 */
/**
 * Tambahkan source GeoJSON bila belum ada; bila sudah ada hanya update data
 * (tidak recreate) agar urutan z layer tetap stabil.
 */
export function upsertGeoJsonSource(
  map: maplibregl.Map,
  sourceId: string,
  data: GeoJSON,
): void {
  const existing = map.getSource(sourceId);
  const src = existing as GeoJsonSource | undefined;
  if (src && typeof src.setData === "function") {
    src.setData(data);
    return;
  }
  map.addSource(sourceId, { type: "geojson", data });
}

/** Tambahkan layer bila belum ada (idempotent). */
export function ensureLayer(
  map: maplibregl.Map,
  layer: maplibregl.LayerSpecification,
): void {
  if (map.getLayer(layer.id)) return;
  map.addLayer(layer);
}

/** Set visibilitas layer bila layer tersebut ada di peta. */
export function setLayerVisibility(
  map: maplibregl.Map,
  layerId: string,
  visible: boolean,
): void {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}