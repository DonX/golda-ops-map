"use client";

/*
  MapBoard.tsx — facelift
  - Modern dark basemap (Carto Dark raster) with no API key
  - Crisp controls, hover popups, better contrasts
  - Sections are first-class, visible by default
*/

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Popup } from "maplibre-gl";

// add this near the top (after imports)
const STYLES = {
  terrain: "/styles/opentopo.json",
  dark: "/styles/carto-dark.json",
} as const;
type StyleKey = keyof typeof STYLES;

type LayerKey = "departments" | "communes" | "sections";

export default function MapBoard() {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<Popup | null>(null);

  // replace your current useState block with:
  const [base, setBase] = useState<StyleKey>("terrain");
  const [visible, setVisible] = useState({ departments: true, communes: false, sections: true });

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLES[base],        // ← switch styles here
      center: [-72.5, 18.9],
      zoom: 7
    });

    mapRef.current = map;

    // Modern controls
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }));

    map.on("load", async () => {
      const deps = await fetch("/data/haiti-departments.min.geojson").then(r => r.json());
      const coms = await fetch("/data/haiti-communes.min.geojson").then(r => r.json());
      const secs = await fetch("/data/haiti-sections.sample.geojson").then(r => r.json());

      // Sources with generateId for hover styling
      map.addSource("departments", { type: "geojson", data: deps, generateId: true });
      map.addSource("communes", { type: "geojson", data: coms, generateId: true });
      map.addSource("sections", { type: "geojson", data: secs, generateId: true });

      // Departments
      map.addLayer({ id: "departments-fill", type: "fill", source: "departments",
        paint: { "fill-color": "#1f2937", "fill-opacity": 0.12 }});
      map.addLayer({ id: "departments-outline", type: "line", source: "departments",
         paint: { "line-color": "#f59e0b", "line-width": 1.4 } }); // deep gold

      // Communes (dashed blue for clarity)
      map.addLayer({ id: "communes-outline", type: "line", source: "communes",
       paint: { "line-color": "#2563eb", "line-width": 0.9, "line-dasharray": [2, 2] } }); // strong blue

      // Sections (priority layer)
      map.addLayer({ id: "sections-fill", type: "fill", source: "sections",
        paint: { "fill-color": "#a78bfa", "fill-opacity": 0.14 } }); // violet tint stands out on green land
      map.addLayer({ id: "sections-outline", type: "line", source: "sections",
       paint: { "line-color": "#a78bfa", "line-width": 0.8 } });

      // Initial visibility
      const apply = (k: LayerKey, on: boolean) => {
        const ids = k === "departments" ? ["departments-fill","departments-outline"]
                 : k === "communes"    ? ["communes-outline"]
                 :                        ["sections-fill","sections-outline"];
        ids.forEach(id => map.setLayoutProperty(id, "visibility", on ? "visible" : "none"));
      };
      (Object.keys(visible) as LayerKey[]).forEach(k => apply(k, visible[k]));

      // Hover popup on Sections & Departments
      popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      const hoverTargets = ["sections-fill", "departments-fill"];

      map.on("mousemove", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: hoverTargets });
        map.getCanvas().style.cursor = features.length ? "pointer" : "";
        if (!features.length) {
          popupRef.current?.remove();
          return;
        }
        const f = features[0];
        const name = (f.properties?.name as string) || "Unnamed";
        popupRef.current!
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font:600 12px Inter,system-ui;color:#111;background:#facc15;padding:4px 6px;border-radius:6px;">${name}</div>`)
          .addTo(map);
      });
      map.on("mouseout", () => popupRef.current?.remove());
    });

    return () => map.remove();
  }, [base, visible]); // ← reinit map when basemap changes

  const toggle = (key: LayerKey) => {
    setVisible(prev => {
      const next = { ...prev, [key]: !prev[key] };
      const map = mapRef.current;
      const ids =
        key === "departments"
          ? ["departments-fill", "departments-outline"]
          : key === "communes"
          ? ["communes-outline"]
          : ["sections-fill", "sections-outline"];
      ids.forEach(id => map?.getLayer(id) && map.setLayoutProperty(id, "visibility", next[key] ? "visible" : "none"));
      return next;
    });
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative bg-black">
      {/* High-contrast chips */}
      <div className="absolute z-10 top-3 left-3 bg-neutral-900/90 text-white rounded-2xl shadow-xl border border-yellow-400 px-3 py-2 flex gap-2">
        <span className="font-semibold">Layers:</span>
        <button onClick={() => toggle("departments")} className={`px-2 py-1 rounded border transition ${visible.departments ? "bg-yellow-400 text-black" : "bg-neutral-800 hover:bg-neutral-700"}`}>Departments</button>
        <button onClick={() => toggle("communes")} className={`px-2 py-1 rounded border transition ${visible.communes ? "bg-blue-400 text-black" : "bg-neutral-800 hover:bg-neutral-700"}`}>Communes</button>
        <button onClick={() => toggle("sections")} className={`px-2 py-1 rounded border transition ${visible.sections ? "bg-green-400 text-black" : "bg-neutral-800 hover:bg-neutral-700"}`}>Sections</button>
      </div>

      {/* Basemap toggle controls */}
      <div className="absolute z-10 top-3 right-3 bg-neutral-900/90 text-white rounded-2xl shadow-xl border border-yellow-400 px-3 py-2 flex gap-2">
        <span className="font-semibold">Basemap:</span>
        <button
          onClick={() => setBase("terrain")}
          className={`px-2 py-1 rounded border transition ${base === "terrain" ? "bg-emerald-400 text-black" : "bg-neutral-800 hover:bg-neutral-700"}`}
        >
          Terrain
        </button>
        <button
          onClick={() => setBase("dark")}
          className={`px-2 py-1 rounded border transition ${base === "dark" ? "bg-yellow-300 text-black" : "bg-neutral-800 hover:bg-neutral-700"}`}
        >
          Dark
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
