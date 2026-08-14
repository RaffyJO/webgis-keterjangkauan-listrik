import { createContext } from "react";
import type maplibregl from "maplibre-gl";

/** Context yang menyediakan instance MapLibre Map ke komponen layer. */
export const MapContext = createContext<maplibregl.Map | null>(null);