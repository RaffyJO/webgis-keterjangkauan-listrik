import { NETWORK_CLASSES } from "../../lib/config";
import { useMapStore } from "../../store/useMapStore";

function ToggleRow({
  checked,
  onChange,
  label,
  indent = false,
  dotColor,
  meta,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  indent?: boolean;
  dotColor?: string;
  meta?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 py-1 text-xs text-slate-700 select-none ${
        indent ? "pl-6" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 shrink-0 accent-blue-600"
      />
      {dotColor && (
        <span
          className="h-3 w-3 shrink-0 rounded-full border border-white shadow"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span className="flex-1">{label}</span>
      {meta && <span className="shrink-0 text-[10px] text-slate-400">{meta}</span>}
    </label>
  );
}

/** Panel toggle layer: batas admin, jaringan (per kelas), buffer, permukiman. */
export default function LayerToggle() {
  const visibility = useMapStore((s) => s.visibility);
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  const networkClassVisible = useMapStore((s) => s.networkClassVisible);
  const setNetworkClassVisible = useMapStore((s) => s.setNetworkClassVisible);
  const bufferClassVisible = useMapStore((s) => s.bufferClassVisible);
  const setBufferClassVisible = useMapStore((s) => s.setBufferClassVisible);
  const processed = useMapStore((s) => s.processed);

  return (
    <section className="rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
      <header className="border-b border-slate-100 pb-2">
        <h1 className="text-sm font-bold text-slate-800">
          WebGIS Keterjangkauan Listrik
        </h1>
        <p className="text-[11px] text-slate-500">Kabupaten Kolaka Timur</p>
      </header>

      <div className="mt-2 divide-y divide-slate-100">
        <div className="py-1">
          <ToggleRow
            checked={visibility.admin}
            onChange={() => toggleLayer("admin")}
            label="Batas Administrasi (Kolaka Timur)"
            dotColor="#1d4ed8"
          />
        </div>

        <div className="py-1">
          <ToggleRow
            checked={visibility.network}
            onChange={() => toggleLayer("network")}
            label="Jaringan Listrik"
          />
          {NETWORK_CLASSES.map((cls) => (
            <ToggleRow
              key={cls.id}
              checked={networkClassVisible[cls.id]}
              onChange={() =>
                setNetworkClassVisible(cls.id, !networkClassVisible[cls.id])
              }
              indent
              dotColor={cls.color}
              label={cls.label}
              meta={`${
                processed?.networkByClass[cls.id]?.features.length ?? 0
              } segmen`}
            />
          ))}
        </div>

        <div className="py-1">
          <ToggleRow
            checked={visibility.buffers}
            onChange={() => toggleLayer("buffers")}
            label="Buffer Jaringan"
          />
          {NETWORK_CLASSES.map((cls) => (
            <ToggleRow
              key={cls.id}
              checked={bufferClassVisible[cls.id]}
              onChange={() =>
                setBufferClassVisible(cls.id, !bufferClassVisible[cls.id])
              }
              indent
              dotColor={cls.color}
              label={`Buffer ${cls.label}`}
              meta={
                cls.bufferRadiusM >= 1000
                  ? `${cls.bufferRadiusM / 1000} km`
                  : `${cls.bufferRadiusM} m`
              }
            />
          ))}
        </div>

        <div className="py-1">
          <ToggleRow
            checked={visibility.settlements}
            onChange={() => toggleLayer("settlements")}
            label="Titik Permukiman"
          />
          <ToggleRow
            checked={visibility.heatmap}
            onChange={() => toggleLayer("heatmap")}
            label="Heatmap Prioritas"
            indent
            meta="skor tinggi"
          />
        </div>

        <div className="py-1 opacity-50">
          <ToggleRow
            checked={false}
            onChange={() => {}}
            label="Gardu Induk (belum tersedia)"
            meta="data menyusul"
          />
        </div>
      </div>
    </section>
  );
}