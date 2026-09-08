import Link from "next/link";
import { getLocationsForPart, listParts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() || "";
  const parts = q ? await listParts(q) : [];

  const results = q
    ? await Promise.all(
        parts.map(async (part) => ({
          part,
          locations: await getLocationsForPart(part.id),
        }))
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Find a part</h1>
        <p className="text-gray-500 text-sm">
          Search for a part to see which locations have it in stock, or scan a location&apos;s QR
          code to see everything there.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Search by name, SKU, or description"
          className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-base"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 text-white px-5 py-2.5 hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {q && (
        <section className="space-y-4">
          {results.length === 0 && (
            <p className="text-sm text-gray-500">No parts match &quot;{q}&quot;.</p>
          )}
          {results.map(({ part, locations }) => (
            <div key={part.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-baseline justify-between">
                <Link href={`/parts/${part.id}`} className="font-medium text-gray-900 hover:underline">
                  {part.name}
                </Link>
                {part.sku && <span className="text-xs text-gray-400">SKU {part.sku}</span>}
              </div>
              {locations.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">Not currently stocked anywhere.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {locations.map(({ location, quantity }) => (
                    <li key={location.id}>
                      <Link
                        href={`/l/${location.code}`}
                        className="flex items-center justify-between text-sm text-gray-700 hover:text-brand-700"
                      >
                        <span>{location.name}</span>
                        <span className="font-semibold">{quantity}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      <div className="flex gap-4 pt-4 border-t border-gray-200 text-sm">
        <Link href="/locations" className="text-brand-700 hover:underline">
          Browse all locations &rarr;
        </Link>
        <Link href="/parts" className="text-brand-700 hover:underline">
          Browse all parts &rarr;
        </Link>
      </div>
    </div>
  );
}
