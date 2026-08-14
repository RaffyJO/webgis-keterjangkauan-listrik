export interface WebGLStatus {
  webgl2: boolean;
  webgl1: boolean;
  message: string;
}

/** Deteksi dukungan WebGL1/WebGL2 pada browser (untuk diagnostik). */
export function detectWebGL(): WebGLStatus {
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    const gl1 =
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    const webgl2 = !!gl2;
    const webgl1 = !!gl1;
    let message = "";
    if (webgl2) message = "WebGL2 tersedia.";
    else if (webgl1)
      message =
        "Hanya WebGL1 yang tersedia — MapLibre butuh WebGL2 untuk rendering. Aktifkan akselerasi hardware / perbarui browser.";
    else
      message =
        "WebGL tidak tersedia di browser ini. Aktifkan akselerasi hardware atau gunakan browser lain.";
    return { webgl2, webgl1, message };
  } catch (e) {
    return {
      webgl2: false,
      webgl1: false,
      message: `Gagal mendeteksi WebGL: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}