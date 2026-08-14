import { useContext } from "react";
import type maplibregl from "maplibre-gl";
import { MapContext } from "../MapContext";

export function useMap(): maplibregl.Map | null {
  return useContext(MapContext);
}