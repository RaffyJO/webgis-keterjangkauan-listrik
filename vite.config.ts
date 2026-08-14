import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

/** Perlakukan file `.geojson` sebagai modul JSON (ESM). */
function geojsonPlugin(): Plugin {
  return {
    name: "geojson-as-json",
    transform(code, id) {
      if (id.endsWith(".geojson")) {
        return { code: `export default ${code};`, map: null };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), geojsonPlugin()],
});
