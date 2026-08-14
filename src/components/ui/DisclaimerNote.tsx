/** Disclaimer domain: jaringan transmisi ≠ distribusi. */
export default function DisclaimerNote() {
  return (
    <div className="rounded-lg bg-amber-50/95 px-3 py-2 text-[11px] leading-snug text-amber-900 shadow ring-1 ring-amber-200">
      <span className="font-bold">Disclaimer domain:</span> data jaringan yang
      tersedia mayoritas <b>transmisi tegangan tinggi (SUTT/SUTET)</b> yang tidak
      menyuplai permukiman secara langsung (harus melalui gardu induk → jaringan
      distribusi JTM/JTR). Skor "keterjangkauan" berbasis jarak ke SUTT/SUTET ini
      adalah <b>proxy kasar potensi ekspansi</b>, bukan indikator area yang sudah
      teraliri listrik.
    </div>
  );
}