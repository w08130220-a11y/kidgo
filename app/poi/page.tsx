import { Nav } from "@/components/Nav";
import { PoiCard } from "@/components/PoiCard";
import { pois } from "@/lib/mock-data";

export const metadata = {
  title: "探索親子景點 ・ ChildTrip",
};

export default function PoiListPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            探索 {pois.length}+ 親子景點
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            全台北、新北雙北精選親子場館。從爸媽真實走過的經驗來的。
          </p>
        </div>

        {/* Filters (mock) */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["全部", "戶外", "室內", "免費", "0-3 歲", "3-6 歲", "6-12 歲", "雨天備案"].map(
            (f, i) => (
              <button
                key={f}
                className={
                  i === 0
                    ? "rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white"
                    : "rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs text-stone-700 transition hover:border-orange-300"
                }
              >
                {f}
              </button>
            )
          )}
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pois.map((poi) => (
            <PoiCard key={poi.id} poi={poi} />
          ))}
        </div>
      </main>
    </>
  );
}
