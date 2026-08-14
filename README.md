# WebGIS Analisis Keterjangkauan Jaringan Listrik — Kab. Kolaka Timur

Aplikasi WebGIS berbasis **React + Vite + TypeScript** untuk menganalisis
keterjangkauan energi listrik di Kabupaten Kolaka Timur (Sulawesi Tenggara),
menghasilkan heatmap dan skor prioritas sebagai rekomendasi ke PLN untuk
perluasan/pembangunan jaringan distribusi listrik.

Seluruh pengolahan data spasial berjalan **di sisi client (browser)** — tanpa
backend/database. Semua data disimpan sebagai file GeoJSON statis.

## Teknologi

- **React** (Vite, TypeScript)
- **MapLibre GL JS** (peta)
- **Turf.js** (`@turf/turf`) — buffer, jarak, overlay, scoring
- **Zustand** — state management (raw + processed GeoJSON)
- **Tailwind CSS v4** — styling

## Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:5173
```

Script lain: `npm run build` (produksi → `dist/`), `npm run typecheck`.

## Struktur

```
src/
  data/                        # GeoJSON statis
    administrasi_kolaka_timur.geojson
    jaringan_listrik_kolaka_timur.geojson
    permukiman.geojson         # MASIH DUMMY — ganti dengan data asli
  lib/
    config.ts                  # threshold, radius buffer, warna, bobot skor
    geoProcessing.ts           # fungsi turf (filter, buffer, jarak, skor)
    heatmapUtils.ts            # transform data → format heatmap MapLibre
  store/
    useMapStore.ts             # zustand: data + visibilitas layer
  components/
    MapView.tsx
    layers/                    # Administration, ElectricNetwork, Buffer, SettlementHeatmap
    ui/                        # LayerToggle, LegendPanel, ScorePanel, DisclaimerNote
  App.tsx
```

## Catatan penting

- **Data permukiman masih dummy** (13 titik di sekitar Kolaka Timur).
  Ganti `src/data/permukiman.geojson` dengan data asli berisi Point/Polygon
  dengan properti opsional `nama`, `jumlah_penduduk`, `jumlah_kk`.
  Loader/state/layer sudah siap (cari komentar `TODO: replace with real permukiman.geojson`).
- **Jaringan mayoritas transmisi (SUTT/SUTET)** yang tidak menyuplai rumah
  tangga langsung. Skor "keterjangkauan" adalah **proxy potensi ekspansi**,
  bukan status teraliri listrik (lihat disclaimer di UI).
- **Threshold & radius** (buffer per kelas, klasifikasi jarak, margin relevansi,
  bobot skor) seluruhnya terpusat di `src/lib/config.ts` dan perlu divalidasi
  dengan standar teknis PLN.
