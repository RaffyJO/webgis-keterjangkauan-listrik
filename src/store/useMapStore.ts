import { create } from "zustand";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";

import adminData from "../data/administrasi_kolaka_timur.geojson";
import networkData from "../data/jaringan_listrik_kolaka_timur.geojson";
// TODO: replace with real permukiman.geojson — saat ini masih data dummy.
// Data asli hanya perlu menyimpan Point/Polygon dengan properti opsional
// `nama`, `jumlah_penduduk`, `jumlah_kk`; loader di bawah sudah siap.
import settlementData from "../data/permukiman.geojson";

import {
  DEFAULT_VISIBILITY,
  KOLAKA_TIMUR,
  type LayerVisibilityKey,
  type NetworkClassId,
} from "../lib/config";
import {
  classifyNetworkByClass,
  filterByKabupaten,
  generateBuffers,
  getBoundaryFeature,
  scoreSettlements,
  summarize,
  type LoadStatus,
  type SettlementScore,
  type SummaryStats,
} from "../lib/geoProcessing";

export interface ProcessedData {
  /** Batas wilayah studi (Kolaka Timur) sebagai Polygon. */
  boundary: Feature<Polygon | MultiPolygon> | null;
  /** Subset fitur Kolaka Timur. */
  adminKolTim: FeatureCollection;
  /** Fitur kabupaten lain sebagai konteks wilayah. */
  adminContext: FeatureCollection;
  /** Segmen jaringan per kelas tegangan (sudah difilter ke Kolaka Timur). */
  networkByClass: Record<string, FeatureCollection>;
  /** Buffer per kelas tegangan (sudah di-clip ke batas wilayah studi). */
  buffersByClass: Record<string, Feature<Polygon | MultiPolygon> | null>;
  /** Hasil skoring tiap permukiman (diurutkan prioritas tertinggi). */
  settlementScores: SettlementScore[];
  summary: SummaryStats | null;
}

interface MapStore {
  status: Record<"admin" | "network" | "settlements", LoadStatus>;
  processed: ProcessedData | null;
  visibility: Record<LayerVisibilityKey, boolean>;
  networkClassVisible: Record<NetworkClassId, boolean>;
  bufferClassVisible: Record<NetworkClassId, boolean>;

  loadAll: () => void;
  toggleLayer: (key: LayerVisibilityKey) => void;
  setNetworkClassVisible: (id: NetworkClassId, visible: boolean) => void;
  setBufferClassVisible: (id: NetworkClassId, visible: boolean) => void;
}

function initialClassVisibility(): Record<NetworkClassId, boolean> {
  return {
    "sutet-275": true,
    "sutt-150": true,
    "sutt-70": true,
    "sutm-20": true,
  };
}

export const useMapStore = create<MapStore>((set) => ({
  status: { admin: "idle", network: "idle", settlements: "idle" },
  processed: null,
  visibility: { ...DEFAULT_VISIBILITY },
  networkClassVisible: initialClassVisibility(),
  bufferClassVisible: initialClassVisibility(),

  loadAll: () => {
    set({
      status: { admin: "loading", network: "loading", settlements: "loading" },
    });

    try {
      const boundary = getBoundaryFeature(adminData, KOLAKA_TIMUR);
      const adminKolTim = filterByKabupaten(adminData, KOLAKA_TIMUR);
      const adminContext = filterByKabupaten(adminData, KOLAKA_TIMUR, {
        exclude: true,
      });

      const networkByClass = classifyNetworkByClass(networkData, boundary);
      const buffersByClass = generateBuffers(networkByClass, boundary);
      const settlementScores = scoreSettlements(
        settlementData as FeatureCollection<Point>,
        networkByClass,
        boundary,
      );
      const summary = summarize(settlementScores);

      set({
        status: { admin: "ready", network: "ready", settlements: "ready" },
        processed: {
          boundary,
          adminKolTim,
          adminContext,
          networkByClass,
          buffersByClass,
          settlementScores,
          summary,
        },
      });
    } catch (err) {
      // Data belum lengkap / tidak valid → jangan crash, tampilkan state error.
      // TODO: replace with real permukiman.geojson jika sumber error ada di data ini.
      console.error("Gagal memuat / memproses data GeoJSON:", err);
      set({
        status: { admin: "error", network: "error", settlements: "error" },
      });
    }
  },

  toggleLayer: (key) =>
    set((s) => ({
      visibility: { ...s.visibility, [key]: !s.visibility[key] },
    })),

  setNetworkClassVisible: (id, visible) =>
    set((s) => ({
      networkClassVisible: { ...s.networkClassVisible, [id]: visible },
    })),

  setBufferClassVisible: (id, visible) =>
    set((s) => ({
      bufferClassVisible: { ...s.bufferClassVisible, [id]: visible },
    })),
}));
