import type { FeatureCollection, Point } from "geojson";
import type { AccessibilityClassConfig } from "./config";
import type { SettlementScore } from "./geoProcessing";

export interface HeatmapPointProperties {
  nama: string;
  priority: number;
  distanceM: number;
  population: number | null;
  accessibilityId: AccessibilityClassConfig["id"];
}

/**
 * Transform hasil skoring menjadi FeatureCollection Point siap pakai sebagai
 * source MapLibre untuk layer `heatmap` dan `circle` permukiman.
 */
export function buildSettlementHeatmapSource(
  scores: SettlementScore[],
): FeatureCollection<Point, HeatmapPointProperties> {
  return {
    type: "FeatureCollection",
    features: scores.map((s) => ({
      type: "Feature",
      properties: {
        nama: s.nama,
        priority: s.priority,
        distanceM: s.distanceM,
        population: s.population,
        accessibilityId: s.accessibilityId,
      },
      geometry: s.feature.geometry,
    })),
  };
}

/**
 * Paint spec untuk layer `type: "heatmap"` MapLibre.
 * `heatmap-weight` di-drive dari skor prioritas (0 = rendah → 1 = tinggi).
 */
export const HEATMAP_PAINT: Record<string, unknown> = {
  "heatmap-weight": [
    "interpolate",
    ["linear"],
    ["get", "priority"],
    0,
    0,
    1,
    1,
  ],
  "heatmap-intensity": 1.2,
  "heatmap-color": [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(33,102,172,0)",
    0.2,
    "rgba(103,169,207,0.9)",
    0.4,
    "rgba(255,255,191,0.9)",
    0.6,
    "rgba(253,219,199,0.9)",
    0.8,
    "rgba(239,138,98,0.9)",
    1,
    "rgba(178,24,43,0.9)",
  ],
  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 14, 10, 34],
  "heatmap-opacity": 0.7,
};

/**
 * Paint spec untuk layer `circle` titik permukiman.
 * Warna = kelas keterjangkauan; ukuran = jumlah penduduk (opsional).
 */
export const SETTLEMENT_CIRCLE_PAINT: Record<string, unknown> = {
  "circle-radius": [
    "interpolate",
    ["linear"],
    ["get", "population"],
    0,
    6,
    10000,
    14,
  ],
  "circle-color": [
    "match",
    ["get", "accessibilityId"],
    "terjangkau",
    "#22c55e",
    "marginal",
    "#eab308",
    "belum",
    "#ef4444",
    "#64748b",
  ],
  "circle-stroke-color": "#ffffff",
  "circle-stroke-width": 1.5,
  "circle-opacity": 0.9,
};

/** Gradient yang dirender di legenda heatmap. */
export const HEATMAP_GRADIENT_STOPS: Array<[number, string]> = [
  [0.0, "#2563eb"],
  [0.35, "#22d3ee"],
  [0.55, "#fef08a"],
  [0.75, "#f97316"],
  [1.0, "#b91c1c"],
];
