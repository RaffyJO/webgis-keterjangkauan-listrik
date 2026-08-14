# WebGIS Analisis Keterjangkauan Jaringan Listrik — Kab. Kolaka Timur

Aplikasi **client-side WebGIS** interaktif yang menganalisis seberapa jauh permukiman di **Kabupaten Kolaka Timur, Sulawesi Tenggara** dari jaringan listrik tegangan tinggi (SUTT/SUTET). Menghasilkan **skor prioritas perluasan jaringan distribusi** berdasarkan jarak dan jumlah penduduk.

**Stack:** React 19 · MapLibre GL JS v4 · Zustand · Turf.js · Tailwind CSS v4 · TypeScript · Vite

![MapLibre](https://img.shields.io/badge/map-MapLibre_GL_v4-1a73e8) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Status](https://img.shields.io/badge/status-development-yellow)

---

## Daftar Isi

- [Tujuan](#tujuan)
- [Data](#data)
- [Metode Analisis](#metode-analisis)
  - [1. Filter Administrasi](#1-filter-administrasi)
  - [2. Klasifikasi Jaringan per Tegangan](#2-klasifikasi-jaringan-per-tegangan)
  - [3. Buffer Bertingkat](#3-buffer-bertingkat)
  - [4. Skoring Tiap Permukiman](#4-skoring-tiap-permukiman)
  - [5. Ringkasan & Rekomendasi](#5-ringkasan--rekomendasi)
- [Struktur Project](#struktur-project)
- [Cara Menjalankan](#cara-menjalankan)
- [Catatan & Keterbatasan](#catatan--keterbatasan)
- [TODO](#todo)

---

## Tujuan

Memberikan **rekomendasi prioritas** kepada PLN / pemangku kepentingan tentang area permukiman mana yang paling membutuhkan perluasan jaringan distribusi listrik.

Prioritas ditentukan oleh **skor komposit**:
- **70%** — jarak ke jaringan terdekat (makin jauh = makin prioritas)
- **30%** — jumlah penduduk (makin padat = makin prioritas)

---

## Data

| File | Deskripsi | Status |
|---|---|---|
| `src/data/administrasi_kolaka_timur.geojson` | Batas administrasi kabupaten se-Sulawesi (difilter ke Kolaka Timur via properti `WADMKK`) | Siap |
| `src/data/jaringan_listrik_kolaka_timur.geojson` | 274+ segmen SUTT/SUTET/SUTM dari OpenStreetMap dengan properti `KELAS JTL` dan `voltage` | Siap |
| `src/data/permukiman.geojson` | 13 titik permukiman dummy (`is_dummy: true`) | **Dummy — belum data asli** |

> ⚠️ Data permukiman saat ini masih **dummy** (13 titik). Hasil analisis akan berubah signifikan saat data asli (desa/kelurahan se-Kolaka Timur) masuk.

---

## Metode Analisis

Semua perhitungan spasial dijalankan **di browser** menggunakan [Turf.js](https://turfjs.org/), tanpa backend. Logika utama ada di [`src/lib/geoProcessing.ts`](src/lib/geoProcessing.ts).

### 1. Filter Administrasi

Fitur GeoJSON dipisah menjadi dua:
- **`adminKolTim`** — polygon Kolaka Timur (`WADMKK === "Kolaka Timur"`)
- **`adminContext`** — kabupaten tetangga sebagai konteks peta

Fungsi: `filterByKabupaten()`

### 2. Klasifikasi Jaringan per Tegangan

Semua segmen jaringan dikelompokkan ke **4 kelas tegangan** berdasarkan properti `KELAS JTL`:

| Kelas | Tegangan | Warna Peta | Buffer Radius |
|---|---|---|---|
| SUTET 275 kV | 275.000 V | Ungu `#a855f7` | 5 km |
| SUTT 150 kV | 150.000 V | Biru `#2563eb` | 3 km |
| SUTT 70 kV | 70.000 V | Teal `#0d9488` | 1 km |
| SUTM 20 kV | 20.000 V | Pink `#ec4899` | 500 m |

**Filter relevansi wilayah:** hanya segmen yang beririsan dengan *buffer 30 km dari batas Kolaka Timur* yang disertakan — karena banyak segmen SUTT/SUTET berada di luar batas kabupaten.

Fungsi: `classifyNetworkByClass()`

### 3. Buffer Bertingkat

Untuk tiap kelas tegangan:
1. Semua segmen digabung jadi satu `MultiLineString`
2. Buffer lingkaran dibuat (`turf.buffer`)
3. Buffer di-*clip* ke batas Kolaka Timur (`turf.intersect`) agar area analisis tidak keluar wilayah studi

Fungsi: `generateBuffers()`

### 4. Skoring Tiap Permukiman

Untuk setiap titik permukiman di dalam batas Kolaka Timur:

**a. Hitung jarak ke jaringan terdekat** — iterasi ke semua segmen jaringan dari keempat kelas tegangan menggunakan `turf.pointToLineDistance`. Jarak terpendek yang digunakan.

**b. Klasifikasi keterjangkauan:**

| Kelas | Jarak | Warna Titik di Peta |
|---|---|---|
| Terjangkau | ≤ 3 km | Hijau `#22c55e` |
| Marginal | 3–5 km | Kuning `#eab308` |
| Belum Terjangkau | > 5 km | Merah `#ef4444` |

Threshold jarak bisa diubah di `config.ts` (`ACCESSIBILITY_CLASSES`).

**c. Hitung skor prioritas komposit (0–1):**

```
skor = 0,7 × (jarak / 10.000) + 0,3 × (populasi / 10.000)
```

Bobot dan normalisasi bisa diubah di `config.ts` (`SCORING`).

Fungsi: `scoreSettlements()`

### 5. Ringkasan & Rekomendasi

Statistik agregat dari semua permukiman:
- Jumlah per kelas keterjangkauan
- Jarak min / rata-rata / maks
- **Top 5 prioritas** — rekomendasi untuk perluasan jaringan
- Rekomendasi utama (prioritas #1)

Fungsi: `summarize()`

---

## Struktur Project

```
src/
├── main.tsx                  # Entry point (React 19 + ErrorBoundary)
├── App.tsx                   # Load data → render MapView
├── index.css                 # Global styles (Tailwind + full-height reset)
├── components/
│   ├── MapView.tsx           # MapLibre GL map + layout panels
│   ├── MapContext.ts         # React context untuk instance map
│   ├── ErrorBoundary.tsx     # Global error boundary
│   ├── layers/
│   │   ├── AdministrationLayer.tsx   # Batas kabupaten (focus + context)
│   │   ├── BufferLayer.tsx           # Buffer per kelas jaringan
│   │   ├── ElectricNetworkLayer.tsx  # Garis jaringan per kelas tegangan
│   │   ├── SettlementHeatmapLayer.tsx# Titik permukiman + heatmap prioritas
│   │   ├── syncHelpers.ts           # Helper manajemen source/layer MapLibre
│   │   └── useMap.ts                # Hook akses map dari context
│   └── ui/
│       ├── LayerToggle.tsx    # Kontrol visibility layer
│       ├── LegendPanel.tsx    # Legenda warna jaringan + buffer + aksesibilitas
│       ├── ScorePanel.tsx     # Statistik + rekomendasi prioritas
│       └── DisclaimerNote.tsx # Disclaimer domain (jaringan transmisi ≠ distribusi)
├── lib/
│   ├── config.ts             # Semua konfigurasi (warna, threshold, bobot)
│   ├── geoProcessing.ts      # Logika analisis spasial (Turf.js)
│   ├── heatmapUtils.ts       # Paint spec heatmap + circle permukiman
│   └── webgl.ts              # Deteksi WebGL untuk diagnostik
├── store/
│   └── useMapStore.ts        # Zustand store (data terproses, visibility)
├── data/
│   ├── administrasi_kolaka_timur.geojson
│   ├── jaringan_listrik_kolaka_timur.geojson
│   └── permukiman.geojson    # Masih dummy!
└── types/
    └── geojson.d.ts           # Type declarations untuk GeoJSON
```

---

## Cara Menjalankan

**Prasyarat:** Node.js 20+ dan npm.

```bash
# Install dependencies
npm install

# Jalankan dev server (HMR aktif)
npm run dev

# Type-check saja
npm run typecheck

# Build produksi
npm run build

# Preview build
npm run preview
```

Buka `http://localhost:5173` di browser.

### Catatan Browser

MapLibre GL JS v4 membutuhkan **WebGL2**. Gunakan Chrome/Edge/Firefox versi terbaru dengan akselerasi hardware aktif.

---

## Catatan & Keterbatasan

### ⚠️ Domain Data

Data jaringan yang tersedia mayoritas **SUTT/SUTET** — jalur transmisi tegangan tinggi antar-provinsi. Permukiman **tidak langsung teraliri** dari sini; harus melalui:

```
SUTT/SUTET → Gardu Induk → JTM (20 kV) → Gardu Distribusi → JTR (380/220 V) → Rumah
```

Skor "keterjangkauan" saat ini adalah **proxy kasar potensi ekspansi**, bukan indikator area yang sudah teraliri listrik. Bila data gardu induk dan jaringan distribusi tersedia, skoring harus diarahkan ke sana.

### ⚠️ Data Permukiman

13 titik permukiman saat ini adalah data **dummy**. Ringkasan statistik tidak mencerminkan kondisi aktual.

### ⚠️ Performa

Semua kalkulasi spasial dijalankan di **main thread** browser. Untuk data asli (ratusan/ribuan desa), scoring perlu dipindahkan ke **Web Worker** agar tidak mem-freeze UI.

---

## TODO

- [ ] **Data permukiman asli** — ganti dummy dengan data desa/kelurahan se-Kolaka Timur
- [ ] **Data gardu induk & jaringan distribusi** — agar skoring akurat (bukan proxy SUTT/SUTET)
- [ ] **Web Worker** — pindahkan `scoreSettlements()` ke worker agar tidak blocking UI
- [ ] **Validasi threshold** — konfirmasi radius buffer dan klasifikasi jarak dengan standar teknis PLN
- [ ] **Verifikasi boundary** — pastikan polygon `WADMKK === "Kolaka Timur"` sesuai data administrasi resmi

---

## Lisensi

Project internal — data dan kode untuk kebutuhan analisis keterjangkauan listrik Kabupaten Kolaka Timur.