/*
  Home page (GOLDA Ops Map)
  - Sticky header with padlock motif
  - Full-height MapBoard below (expects a 4rem/64px header)
*/
import MapBoard from "@/components/MapBoard";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="h-16 sticky top-0 bg-neutral-950/90 border-b border-yellow-400 flex items-center px-4 justify-between">
        <h1 className="text-lg font-bold">GOLDA Ops Map</h1>
        <div className="text-yellow-400">🔒 Public Read</div>
      </header>
      <MapBoard />
    </main>
  );
}
