import {
  ACCESSIBILITY_CLASSES,
  NETWORK_CLASSES,
} from "../../lib/config";
import { useMapStore } from "../../store/useMapStore";
import type { SettlementScore } from "../../lib/geoProcessing";

function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m} m`;
}

function nearestClassLabel(score: SettlementScore): string {
  const cls = NETWORK_CLASSES.find((c) => c.id === score.nearestClassId);
  return cls?.label ?? "—";
}

function classConfig(score: SettlementScore) {
  return ACCESSIBILITY_CLASSES.find((c) => c.id === score.accessibilityId);
}

/** Panel statistik & rekomendasi prioritas untuk input ke PLN. */
export default function ScorePanel() {
  const status = useMapStore((s) => s.status.settlements);
  const summary = useMapStore((s) => s.processed?.summary ?? null);

  if (status === "error") {
    return (
      <section className="rounded-xl bg-red-50/95 p-4 text-xs text-red-800 shadow-lg ring-1 ring-red-200">
        Gagal memuat / memproses data. Periksa file GeoJSON di{" "}
        <code>src/data/</code> dan konsol browser.
        {/* TODO: replace with real permukiman.geojson */}
      </section>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <section className="rounded-xl bg-white/95 p-4 text-xs text-slate-500 shadow-lg ring-1 ring-slate-200">
        Memuat data &amp; menjalankan analisis spasial…
      </section>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <section className="rounded-xl bg-white/95 p-4 text-xs text-slate-500 shadow-lg ring-1 ring-slate-200">
        Tidak ada data permukiman pada wilayah studi.
        {/* TODO: replace with real permukiman.geojson */}
      </section>
    );
  }

  const isDummyData = summary.topPriority.some((s) => s.isDummy);

  const top = summary.topPriority[0];

  return (
    <section className="rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        Analisis &amp; Rekomendasi
      </h2>

      {isDummyData && (
        <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50/95 px-2 py-1.5 text-[10px] leading-snug text-amber-900">
          ⚠️ Berbasis <b>{summary.total} titik dummy</b> — bukan data permukiman
          aktual. Hasil akan berubah saat data riil masuk.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total" value={String(summary.total)} />
        {ACCESSIBILITY_CLASSES.map((cls) => (
          <Stat
            key={cls.id}
            label={cls.label}
            value={String(summary.byAccessibility[cls.id])}
            color={cls.color}
          />
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600">
        <div className="rounded-lg bg-slate-50 py-1.5">
          <div className="font-semibold text-slate-800">
            {formatDistance(summary.minDistanceM)}
          </div>
          <div className="text-[10px] text-slate-400">Jarak terdekat</div>
        </div>
        <div className="rounded-lg bg-slate-50 py-1.5">
          <div className="font-semibold text-slate-800">
            {formatDistance(summary.avgDistanceM)}
          </div>
          <div className="text-[10px] text-slate-400">Rata-rata</div>
        </div>
        <div className="rounded-lg bg-slate-50 py-1.5">
          <div className="font-semibold text-slate-800">
            {formatDistance(summary.maxDistanceM)}
          </div>
          <div className="text-[10px] text-slate-400">Terjauh</div>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold text-slate-500">
          Prioritas perluasan jaringan (top 5)
        </p>
        <ol className="space-y-1">
          {summary.topPriority.map((score, i) => {
            const cls = classConfig(score);
            return (
              <li
                key={`${score.nama}-${i}`}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px]"
              >
                <span className="w-4 shrink-0 text-center font-bold text-slate-400">
                  {i + 1}
                </span>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cls?.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-800">
                    {score.nama}
                    {score.isDummy && (
                      <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-normal text-amber-700">
                        dummy
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {formatDistance(score.distanceM)} · {nearestClassLabel(score)}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold text-slate-700">
                  {score.priority.toFixed(3)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {top && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-2 text-[11px] leading-snug text-blue-900">
          <span className="font-semibold">Rekomendasi:</span> prioritaskan
          perluasan/penambahan jaringan distribusi di area{" "}
          <b>{top.nama}</b> (jarak {formatDistance(top.distanceM)} ke{" "}
          {nearestClassLabel(top)}, skor prioritas{" "}
          <b>{top.priority.toFixed(3)}</b>).
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 py-1.5 text-center">
      <div
        className="text-sm font-bold"
        style={{ color: color ?? "#0f172a" }}
      >
        {value}
      </div>
      <div className="truncate text-[10px] text-slate-400">{label}</div>
    </div>
  );
}