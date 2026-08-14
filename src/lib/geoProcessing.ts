import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from "geojson";
import * as turf from "@turf/turf";
import {
  ACCESSIBILITY_CLASSES,
  NETWORK_CLASSES,
  NETWORK_RELEVANCE_MARGIN_M,
  SCORING,
  type AccessibilityClassConfig,
} from "./config";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface SettlementScore {
  feature: Feature<Point>;
  nama: string;
  population: number | null;
  jumlahKk: number | null;
  distanceM: number;
  nearestClassId: string | null;
  accessibilityId: AccessibilityClassConfig["id"];
  priority: number;
  isDummy: boolean;
}

export interface SummaryStats {
  total: number;
  byAccessibility: Record<AccessibilityClassConfig["id"], number>;
  avgDistanceM: number;
  minDistanceM: number;
  maxDistanceM: number;
  topPriority: SettlementScore[];
}

/* ------------------------------------------------------------------ */
/* Filter administrasi                                                  */
/* ------------------------------------------------------------------ */

/**
 * Ambil subset fitur berdasarkan nama kabupaten (properti `WADMKK` atau
 * `NAMOBJ`). Default: hanya kabupaten yang cocok; set `opts.exclude` untuk
 * mendapatkan kebalikannya (fitur selain kabupaten tsb — konteks wilayah).
 */
export function filterByKabupaten(
  fc: FeatureCollection,
  kabupatenName: string,
  opts: { exclude?: boolean } = {},
): FeatureCollection {
  const { exclude = false } = opts;
  return {
    type: "FeatureCollection",
    features: fc.features.filter((f) => {
      const p = f.properties ?? {};
      const matches =
        p.WADMKK === kabupatenName || p.NAMOBJ === kabupatenName;
      return exclude ? !matches : matches;
    }),
  };
}

/** Ambil fitur batas wilayah studi (Kolaka Timur) sebagai Polygon/MultiPolygon. */
export function getBoundaryFeature(
  adminFc: FeatureCollection,
  kabupatenName: string,
): Feature<Polygon | MultiPolygon> | null {
  const feat = adminFc.features.find(
    (f) =>
      (f.properties?.WADMKK ?? "") === kabupatenName ||
      (f.properties?.NAMOBJ ?? "") === kabupatenName,
  );
  if (!feat) return null;
  return feat as Feature<Polygon | MultiPolygon>;
}

/* ------------------------------------------------------------------ */
/* Jaringan listrik                                                    */
/* ------------------------------------------------------------------ */

/** Gabungkan semua segmen LineString/MultiLineString jadi satu MultiLineString. */
function toMultiLine(
  fc: FeatureCollection,
): Feature<MultiLineString> | null {
  const coordinates: Position[][] = [];
  for (const f of fc.features) {
    if (f.geometry.type === "LineString") coordinates.push(f.geometry.coordinates);
    else if (f.geometry.type === "MultiLineString")
      coordinates.push(...f.geometry.coordinates);
  }
  if (coordinates.length === 0) return null;
  return turf.multiLineString(coordinates);
}

/**
 * Kelompokkan segmen jaringan per kelas tegangan, lalu filter hanya segmen
 * yang relevan dengan wilayah studi: beririsan dengan buffer batas wilayah
 * Kolaka Timur selebar `NETWORK_RELEVANCE_MARGIN_M`. Margin = 0 berarti hanya
 * segmen di dalam batas kabupaten.
 */
export function classifyNetworkByClass(
  networkFc: FeatureCollection,
  boundary: Feature<Polygon | MultiPolygon> | null,
): Record<string, FeatureCollection> {
  // Relevance polygon dibangun sekali untuk semua kelas.
  let relevance: Feature<Polygon | MultiPolygon> | null = boundary;
  if (boundary && NETWORK_RELEVANCE_MARGIN_M > 0) {
    try {
      relevance = turf.buffer(boundary as never, NETWORK_RELEVANCE_MARGIN_M / 1000, {
        units: "kilometers",
      }) as Feature<Polygon | MultiPolygon> | null;
    } catch {
      relevance = boundary;
    }
  }

  const result: Record<string, FeatureCollection> = {};
  for (const cls of NETWORK_CLASSES) {
    result[cls.id] = {
      type: "FeatureCollection",
      features: networkFc.features.filter((f) => {
        const props = f.properties ?? {};
        const matchesClass =
          props["KELAS JTL"] === cls.kelasJtl || props.voltage === cls.voltage;
        if (!matchesClass) return false;
        if (relevance) return turf.booleanIntersects(f as never, relevance as never);
        return true;
      }),
    };
  }
  return result;
}

/**
 * Generate buffer bertingkat per kelas tegangan, lalu clip ke batas wilayah
 * studi agar layer buffer tidak keluar dari area analisis.
 */
export function generateBuffers(
  networkByClass: Record<string, FeatureCollection>,
  boundary: Feature<Polygon | MultiPolygon> | null,
): Record<string, Feature<Polygon | MultiPolygon> | null> {
  const result: Record<string, Feature<Polygon | MultiPolygon> | null> = {};
  for (const cls of NETWORK_CLASSES) {
    const fc = networkByClass[cls.id] ?? { type: "FeatureCollection", features: [] };
    const multi = toMultiLine(fc);
    if (!multi) {
      result[cls.id] = null;
      continue;
    }
    const radiusKm = cls.bufferRadiusM / 1000;
    const buffered = turf.buffer(multi, radiusKm, { units: "kilometers" });
    if (!buffered) {
      result[cls.id] = null;
      continue;
    }
    if (boundary) {
      try {
        result[cls.id] =
          turf.intersect(
            turf.featureCollection([buffered as never, boundary as never]),
          ) ?? buffered;
      } catch {
        result[cls.id] = buffered;
      }
    } else {
      result[cls.id] = buffered;
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Jarak & skor permukiman                                             */
/* ------------------------------------------------------------------ */

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Klasifikasi keterjangkauan berdasarkan jarak ke jaringan terdekat. */
export function classifyDistance(distanceM: number): AccessibilityClassConfig {
  return (
    ACCESSIBILITY_CLASSES.find((c) => distanceM <= c.maxDistanceM) ??
    ACCESSIBILITY_CLASSES[ACCESSIBILITY_CLASSES.length - 1]
  );
}

/**
 * Composite priority score (0–1, semakin tinggi = semakin prioritas untuk
 * rekomendasi perluasan jaringan ke PLN).
 * Skor = bobotJarak × normalisasiJarak + bobotPopulasi × normalisasiPopulasi.
 */
export function computePriority(
  distanceM: number,
  population: number | null,
): number {
  const distanceScore = Math.min(1, distanceM / SCORING.maxRelevantDistanceM);
  const populationScore =
    population == null
      ? 0
      : Math.min(1, population / SCORING.maxPopulationForScore);
  return Math.min(
    1,
    SCORING.distanceWeight * distanceScore +
      SCORING.populationWeight * populationScore,
  );
}

/**
 * Hitung jarak tiap permukiman ke segmen jaringan terdekat (per kelas),
 * klasifikasikan keterjangkauannya, dan hitung skor prioritas komposit.
 *
 * `turf.pointToLineDistance` hanya menerima LineString, jadi iterasi dilakukan
 * per segmen (bukan MultiLineString). Untuk data riil dengan ratusan segmen dan
 * ratusan permukiman tetap aman dijalankan di client.
 */
export function scoreSettlements(
  settlementsFc: FeatureCollection<Point>,
  networkByClass: Record<string, FeatureCollection>,
  boundary: Feature<Polygon | MultiPolygon> | null,
): SettlementScore[] {
  const linesByClass: Record<string, Array<Feature<LineString | MultiLineString>>> = {};
  for (const cls of NETWORK_CLASSES) {
    const features = networkByClass[cls.id]?.features ?? [];
    linesByClass[cls.id] = features.filter(
      (f) => f.geometry.type === "LineString" || f.geometry.type === "MultiLineString",
    ) as Array<Feature<LineString | MultiLineString>>;
  }

  const scores: SettlementScore[] = [];
  for (const feature of settlementsFc.features) {
    if (feature.geometry.type !== "Point") continue;
    if (boundary && !turf.booleanPointInPolygon(feature as never, boundary as never))
      continue;

    let nearestM = Infinity;
    let nearestClassId: string | null = null;
    for (const cls of NETWORK_CLASSES) {
      for (const line of linesByClass[cls.id]) {
        let distKm: number;
        if (line.geometry.type === "MultiLineString") {
          let best = Infinity;
          for (const partCoords of line.geometry.coordinates) {
            const part = turf.lineString(partCoords);
            const d = turf.pointToLineDistance(feature as never, part as never, {
              units: "kilometers",
            });
            if (d < best) best = d;
          }
          distKm = best;
        } else {
          distKm = turf.pointToLineDistance(feature as never, line as never, {
            units: "kilometers",
          });
        }
        const distM = distKm * 1000;
        if (distM < nearestM) {
          nearestM = distM;
          nearestClassId = cls.id;
        }
      }
    }
    if (!Number.isFinite(nearestM)) nearestM = SCORING.maxRelevantDistanceM;

    const population = toNumber(feature.properties?.jumlah_penduduk);
    const accessibility = classifyDistance(nearestM);

    scores.push({
      feature,
      nama: String(feature.properties?.nama ?? "Permukiman"),
      population,
      jumlahKk: toNumber(feature.properties?.jumlah_kk),
      distanceM: Math.round(nearestM),
      nearestClassId,
      accessibilityId: accessibility.id,
      priority: computePriority(nearestM, population),
      isDummy: feature.properties?.is_dummy === true,
    });
  }

  return scores.sort((a, b) => b.priority - a.priority);
}

/** Ringkasan statistik hasil skoring untuk panel rekomendasi. */
export function summarize(scores: SettlementScore[]): SummaryStats {
  const byAccessibility: Record<AccessibilityClassConfig["id"], number> = {
    terjangkau: 0,
    marginal: 0,
    belum: 0,
  };
  for (const s of scores) byAccessibility[s.accessibilityId] += 1;

  const distances = scores.map((s) => s.distanceM);
  const avg = distances.length
    ? distances.reduce((a, b) => a + b, 0) / distances.length
    : 0;

  return {
    total: scores.length,
    byAccessibility,
    avgDistanceM: Math.round(avg),
    minDistanceM: distances.length ? Math.min(...distances) : 0,
    maxDistanceM: distances.length ? Math.max(...distances) : 0,
    topPriority: scores.slice(0, 5),
  };
}
