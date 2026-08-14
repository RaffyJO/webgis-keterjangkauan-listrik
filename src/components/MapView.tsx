import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  BASE_MAP_STYLE,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_MAP_ZOOM,
} from "../lib/config";
import { detectWebGL } from "../lib/webgl";
import { MapContext } from "./MapContext";
import AdministrationLayer from "./layers/AdministrationLayer";
import BufferLayer from "./layers/BufferLayer";
import ElectricNetworkLayer from "./layers/ElectricNetworkLayer";
import SettlementHeatmapLayer from "./layers/SettlementHeatmapLayer";
import DisclaimerNote from "./ui/DisclaimerNote";
import LayerToggle from "./ui/LayerToggle";
import LegendPanel from "./ui/LegendPanel";
import ScorePanel from "./ui/ScorePanel";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const styleReadyRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mapInstance: maplibregl.Map | null = null;
    try {
      mapInstance = new maplibregl.Map({
        container: containerRef.current,
        style: BASE_MAP_STYLE,
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM,
        maxZoom: MAX_MAP_ZOOM,
      });
    } catch (e) {
      const gl = detectWebGL();
      setInitError(
        `Tidak dapat membuat peta: ${
          e instanceof Error ? e.message : String(e)
        } — ${gl.message}`,
      );
      return;
    }
    mapRef.current = mapInstance;
    setMap(mapInstance);
    (window as unknown as { __testMap?: maplibregl.Map }).__testMap = mapInstance;

    const onLoad = () => {
      if (styleReadyRef.current) return; // guard double-fire
      styleReadyRef.current = true;
      setStyleReady(true);
    };
    const onError = (e: { error?: Error }) => {
      // Tile/sprite/glyph errors per-request tidak fatal; hanya tampilkan
      // pesan bila style dasar belum selesai dimuat.
      if (!styleReadyRef.current) {
        setMapError(e?.error?.message ?? "Gagal memuat style / tiles peta.");
      }
    };

    // PENTING: Saat style adalah object (bukan URL), MapLibre memuatnya
    // synchronously saat konstruksi. Event `load` bisa terpancar SEBELUM
    // listener `on("load",…)` dipasang. Guard di `onLoad` mencegah double-fire.
    mapInstance.once("load", onLoad);
    // Inline style sudah selesai dimuat → panggil handler langsung.
    if (mapInstance.loaded()) onLoad();
    mapInstance.on("error", onError);

    mapInstance.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );
    mapInstance.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-right",
    );

    return () => {
      mapInstance.off("load", onLoad);
      mapInstance.off("error", onError);
      mapInstance.remove();
      mapRef.current = null;
      setMap(null);
      styleReadyRef.current = false;
      setStyleReady(false);
      setMapError(null);
      delete (window as unknown as { __testMap?: maplibregl.Map }).__testMap;
    };
  }, []);

  return (
    <div className="relative h-screen w-full min-h-[400px]">
      <div ref={containerRef} className="h-full w-full" />

      {initError && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-6">
          <div className="pointer-events-auto max-w-lg rounded-xl bg-red-50/95 p-4 text-xs text-red-900 shadow-lg ring-1 ring-red-200">
            <p className="font-bold">Peta tidak dapat diinisialisasi.</p>
            <p className="mt-1 break-words">{initError}</p>
            <p className="mt-2 text-red-700">
              Buka DevTools (F12) → Console untuk detail lebih lanjut.
            </p>
          </div>
        </div>
      )}

      {map && (
        <MapContext.Provider value={map}>
          {/* Mount order = z-order layer (bottom → top) */}
          {styleReady && (
            <>
              <BufferLayer />
              <SettlementHeatmapLayer />
              <ElectricNetworkLayer />
              <AdministrationLayer />
            </>
          )}

          {!styleReady && !mapError && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="rounded-lg bg-white/90 px-4 py-2 text-xs text-slate-600 shadow">
                Memuat peta dasar…
              </div>
            </div>
          )}

          {mapError && (
            <div className="pointer-events-none absolute bottom-16 left-3 z-20 max-w-sm rounded-lg bg-red-50/95 px-3 py-2 text-[11px] text-red-800 shadow ring-1 ring-red-200">
              Gagal memuat peta dasar: {mapError}
              <br />
              Periksa koneksi internet ke <code>tile.openstreetmap.org</code>.
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="pointer-events-auto absolute left-3 top-3 flex w-72 max-h-[calc(100vh-3rem)] flex-col gap-3 overflow-y-auto pr-1">
              <LayerToggle />
              <LegendPanel />
              <DisclaimerNote />
            </div>

            <div className="pointer-events-auto absolute right-3 top-3 w-80 max-h-[calc(100vh-3rem)] overflow-y-auto">
              <ScorePanel />
            </div>
          </div>

        </MapContext.Provider>
      )}
    </div>
  );
}