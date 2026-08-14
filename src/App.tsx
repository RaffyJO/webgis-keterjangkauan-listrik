import { useEffect } from "react";
import MapView from "./components/MapView";
import { useMapStore } from "./store/useMapStore";

export default function App() {
  const loadAll = useMapStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="h-screen w-screen">
      <MapView />
    </div>
  );
}