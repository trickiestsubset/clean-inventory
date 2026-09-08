import Link from "next/link";
import { listLocations } from "@/lib/data";
import { createLocation } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const locations = await listLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
        {locations.length > 0 && (
          <Link
            href="/locations/print"
            className="text-sm text-brand-700 hover:underline whitespace-nowrap"
          >
            Print all QR labels
          </Link>
        )}
      </div>

      {searchParams.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {searchParams.error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-medium text-gray-900 mb-3">Add a location</h2>
        <form action={createLocation} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="name"
            placeholder="e.g. Shelf A3, Van 2 drawer 4"
            required
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="notes"
            placeholder="Notes (optional)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 text-white text-sm px-4 py-2 hover:bg-brand-700 whitespace-nowrap"
          >
            Create + generate QR
          </button>
        </form>
      </div>

      {locations.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No locations yet. Add one above, then print its QR code and stick it on the shelf/bin.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${loc.code}`}
                alt={`QR code for ${loc.name}`}
                width={120}
                height={120}
                className="rounded-lg border border-gray-100"
              />
              <Link href={`/l/${loc.code}`} className="font-medium text-gray-900 hover:underline">
                {loc.name}
              </Link>
              {loc.notes && <p className="text-xs text-gray-500">{loc.notes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
