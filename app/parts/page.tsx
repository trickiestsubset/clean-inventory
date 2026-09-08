import Image from "next/image";
import Link from "next/link";
import { getPartTotalQuantities, listParts } from "@/lib/data";
import { createPart } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function PartsPage({
  searchParams,
}: {
  searchParams: { q?: string; error?: string };
}) {
  const q = searchParams.q || "";
  const [parts, totals] = await Promise.all([listParts(q), getPartTotalQuantities()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Parts catalog</h1>

      {searchParams.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {searchParams.error}
        </div>
      )}

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, SKU, or description"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-gray-900 text-white text-sm px-4 py-2 hover:bg-gray-700"
        >
          Search
        </button>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2">
        {parts.map((part) => (
          <li key={part.id}>
            <Link
              href={`/parts/${part.id}`}
              className="flex gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-300 transition-colors"
            >
              {part.photo_url ? (
                <Image
                  src={part.photo_url}
                  alt={part.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                  No photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-gray-900 truncate">{part.name}</span>
                  <span className="text-sm font-semibold text-brand-700 whitespace-nowrap">
                    {totals[part.id] || 0} total
                  </span>
                </div>
                {part.sku && <p className="text-xs text-gray-400">SKU {part.sku}</p>}
                {part.description && (
                  <p className="text-sm text-gray-500 truncate">{part.description}</p>
                )}
              </div>
            </Link>
          </li>
        ))}
        {parts.length === 0 && (
          <p className="text-sm text-gray-500">No parts match that search.</p>
        )}
      </ul>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-medium text-gray-900 mb-3">Add a part to the catalog</h2>
        <p className="text-xs text-gray-500 mb-3">
          This registers a part without stocking it anywhere yet. To add stock, use a location
          page instead (scan its QR code, or open it from Locations).
        </p>
        <form action={createPart} className="space-y-3" encType="multipart/form-data">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="name"
              placeholder="Part name"
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="sku"
              placeholder="SKU / part number (optional)"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="description"
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input type="file" name="photo" accept="image/*" capture="environment" className="text-sm" />
          <button
            type="submit"
            className="rounded-md bg-brand-600 text-white text-sm px-4 py-2 hover:bg-brand-700"
          >
            Add part
          </button>
        </form>
      </div>
    </div>
  );
}
