/**
 * Konfigurasi terpusat untuk seluruh analisis keterjangkauan listrik.
 *
 * Seluruh threshold / radius buffer / warna / bobot skor ditaruh di sini
 * agar mudah divalidasi ulang dengan standar teknis PLN.
 */

import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap OpenStreetMap (raster tiles). Inline style — tanpa fetch style
 * eksternal, sehingga map & layer siap cepat dan tidak bergantung layanan
 * pihak ketiga selain tile OSM itu sendiri.
 */
export const BASE_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "OpenStreetMap",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  // Font dari demotiles MapLibre — gratis, ringan, tanpa API key.
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const DEFAULT_MAP_CENTER: [number, number] = [121.5664, -3.8204];
export const DEFAULT_MAP_ZOOM = 10;
export const MAX_MAP_ZOOM = 18;

/** Nama kabupaten studi (harus cocok dengan properti `WADMKK` di data admin). */
export const KOLAKA_TIMUR = "Kolaka Timur";

/**
 * Margin relevansi (meter) dari batas Kolaka Timur.
 *
 * Data jaringan mayoritas adalah jalur transmisi regional (SUTT/SUTET) yang
 * letaknya TIDAK seluruhnya di dalam batas kabupaten. Untuk tetap fokus pada
 * area studi namun tidak membuang jalur yang relevan untuk potensi ekspansi,
 * segmen jaringan disertakan bila beririsan dengan buffer batas wilayah
 * selebar margin ini. Set ke `0` untuk filter ketat (hanya yang di dalam
 * Kolaka Timur).
 * TODO: validasi nilai ini dengan standar teknis PLN / data jaringan distribusi asli.
 */
export const NETWORK_RELEVANCE_MARGIN_M = 30000;

/* ------------------------------------------------------------------ */
/* Konfigurasi kelas jaringan listrik                                  */
/* ------------------------------------------------------------------ */

export type NetworkClassId = "sutet-275" | "sutt-150" | "sutt-70" | "sutm-20";

export interface NetworkClassConfig {
  id: NetworkClassId;
  /** Label yang ditampilkan di UI / legend. */
  label: string;
  /** Nilai persis properti `KELAS JTL` pada geojson. */
  kelasJtl: string;
  /** Tegangan (volt) sebagai fallback matching. */
  voltage: number;
  /** Warna garis jaringan di peta. */
  color: string;
  /**
   * Radius buffer dalam meter.
   * TODO: validasi radius ini dengan standar teknis PLN (jarak aman / area
   * pelayanan gardu distribusi). Angka di bawah hanya perkiraan awal.
   */
  bufferRadiusM: number;
}

export const NETWORK_CLASSES: NetworkClassConfig[] = [
  {
    id: "sutet-275",
    label: "SUTET 275 kV",
    kelasJtl: "SUTET 275 kV",
    voltage: 275000,
    color: "#a855f7",
    bufferRadiusM: 5000,
  },
  {
    id: "sutt-150",
    label: "SUTT 150 kV",
    kelasJtl: "SUTT 150 kV",
    voltage: 150000,
    color: "#2563eb",
    bufferRadiusM: 3000,
  },
  {
    id: "sutt-70",
    label: "SUTT 70 kV",
    kelasJtl: "SUTT 70 kV",
    voltage: 70000,
    color: "#0d9488",
    bufferRadiusM: 1000,
  },
  {
    id: "sutm-20",
    label: "SUTM 20 kV",
    kelasJtl: "SUTM 20 kV",
    voltage: 20000,
    color: "#ec4899",
    bufferRadiusM: 500,
  },
];

/* ------------------------------------------------------------------ */
/* Konfigurasi klasifikasi keterjangkauan                              */
/* ------------------------------------------------------------------ */

export type AccessibilityId = "terjangkau" | "marginal" | "belum";

export interface AccessibilityClassConfig {
  id: AccessibilityId;
  label: string;
  /** Batas atas jarak (m, inklusif) ke jaringan untuk kelas ini. */
  maxDistanceM: number;
  color: string;
  description: string;
}

export const ACCESSIBILITY_CLASSES: AccessibilityClassConfig[] = [
  {
    id: "terjangkau",
    label: "Terjangkau",
    maxDistanceM: 3000,
    color: "#22c55e",
    description: "jarak ke jaringan ≤ 3 km (proxy potensi)",
  },
  {
    id: "marginal",
    label: "Marginal",
    maxDistanceM: 5000,
    color: "#eab308",
    description: "jarak ke jaringan 3–5 km",
  },
  {
    id: "belum",
    label: "Belum Terjangkau",
    maxDistanceM: Infinity,
    color: "#ef4444",
    description: "jarak ke jaringan > 5 km",
  },
];

/* ------------------------------------------------------------------ */
/* Konfigurasi composite priority score                                */
/* ------------------------------------------------------------------ */

export const SCORING = {
  /** Jarak (m) yang dianggap "sangat jauh" → skor jarak dipenuhi (1.0). */
  maxRelevantDistanceM: 10000,
  /** Bobot komponen jarak dalam skor prioritas. */
  distanceWeight: 0.7,
  /** Bobot komponen jumlah penduduk dalam skor prioritas. */
  populationWeight: 0.3,
  /** Populasi yang dianggap "padat" → skor populasi dipenuhi (1.0). */
  maxPopulationForScore: 10000,
} as const;

/* ------------------------------------------------------------------ */
/* Visibilitas layer (default)                                         */
/* ------------------------------------------------------------------ */

export type LayerVisibilityKey =
  | "admin"
  | "network"
  | "buffers"
  | "settlements"
  | "heatmap";

export const DEFAULT_VISIBILITY: Record<LayerVisibilityKey, boolean> = {
  admin: true,
  network: true,
  buffers: true,
  settlements: true,
  heatmap: true,
};
