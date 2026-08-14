import {
  ACCESSIBILITY_CLASSES,
  NETWORK_CLASSES,
} from "../../lib/config";
import { HEATMAP_GRADIENT_STOPS } from "../../lib/heatmapUtils";

function LegendItem({
  color,
  label,
  note,
}: {
  color: string;
  label: string;
  note?: string;
}) {
  return (
    <li className="flex items-center gap-2 py-0.5 text-[11px] text-slate-700">
      <span
        className="h-3 w-3 shrink-0 rounded-full border border-white shadow"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1">{label}</span>
      {note && <span className="shrink-0 text-[10px] text-slate-400">{note}</span>}
    </li>
  );
}

/** Panel legenda warna jaringan, buffer, kelas keterjangkauan, dan heatmap. */
export default function LegendPanel() {
  const gradientCss = `linear-gradient(90deg, ${HEATMAP_GRADIENT_STOPS.map(
    ([t, c]) => `${c} ${Math.round(t * 100)}%`,
  ).join(", ")})`;

  return (
    <section className="rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
      <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-600">
        Legenda
      </h2>

      <div className="mb-2">
        <p className="mb-1 text-[11px] font-semibold text-slate-500">
          Jaringan Listrik
        </p>
        <ul>
          {NETWORK_CLASSES.map((cls) => (
            <LegendItem key={cls.id} color={cls.color} label={cls.label} />
          ))}
        </ul>
      </div>

      <div className="mb-2">
        <p className="mb-1 text-[11px] font-semibold text-slate-500">
          Buffer (per kelas, di-clip ke Kolaka Timur)
        </p>
        <ul>
          {NETWORK_CLASSES.map((cls) => (
            <LegendItem
              key={cls.id}
              color={cls.color}
              label={cls.label}
              note={
                cls.bufferRadiusM >= 1000
                  ? `± ${cls.bufferRadiusM / 1000} km`
                  : `± ${cls.bufferRadiusM} m`
              }
            />
          ))}
        </ul>
      </div>

      <div className="mb-2">
        <p className="text-[11px] font-semibold text-slate-500">
          Titik Permukiman — Keterjangkauan
        </p>
        <ul>
          {ACCESSIBILITY_CLASSES.map((cls) => (
            <LegendItem
              key={cls.id}
              color={cls.color}
              label={cls.label}
              note={cls.description}
            />
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold text-slate-500">
          Heatmap Prioritas
        </p>
        <div
          className="h-3 w-full rounded-full"
          style={{ background: gradientCss }}
        />
        <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
          <span>Prioritas rendah</span>
          <span>Prioritas tinggi</span>
        </div>
      </div>

      <p className="mt-2 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
        Threshold &amp; radius dapat diubah di <code>src/lib/config.ts</code>{" "}
        (validasi dengan standar teknis PLN).
      </p>
    </section>
  );
}