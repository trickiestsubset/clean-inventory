import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInventoryForLocation, getLocationByCode, listParts } from "@/lib/data";
import {
  addExistingPartToLocation,
  addNewPartToLocation,
  addStock,
  pullStock,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function LocationPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { error?: string };
}) {
  const location = await getLocationByCode(params.code);
  if (!location) notFound();

  const [inventory, allParts] = await Promise.all([
    getInventoryForLocation(location.id),
    listParts(),
  ]);

  const stockedPartIds = new Set(inventory.map((row) => row.part_id));
  const partsNotHere = allParts.filter((p) => !stockedPartIds.has(p.id));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/locations" className="hover:underline">
            Locations
          </Link>{" "}
          / {location.name}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">{location.name}</h1>
        {location.notes && <p className="text-gray-500 mt-1">{location.notes}</p>}
      </div>

      {searchParams.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {searchParams.error}
        </div>
      )}

      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          What&apos;s here ({inventory.length})
        </h2>
        {inventory.length === 0 ? (
          <p className="text-gray-500 text-sm">Nothing stocked at this location yet.</p>
        ) : (
          <ul className="space-y-3">
            {inventory.map((row) => (
              <li
                key={row.part_id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4"
              >
                {row.part.photo_url ? (
                  <Image
                    src={row.part.photo_url}
                    alt={row.part.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                    No photo
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/parts/${row.part.id}`}
                      className="font-medium text-gray-900 hover:underline truncate"
                    >
                      {row.part.name}
                    </Link>
                    <span className="text-lg font-semibold text-brand-700 whitespace-nowrap">
                      {row.quantity}
                    </span>
                  </div>
                  {row.part.sku && <p className="text-xs text-gray-400">SKU {row.part.sku}</p>}

                  <div className="mt-2 flex gap-2">
                    <form action={pullStock} className="flex items-center gap-1">
                      <input type="hidden" name="location_id" value={location.id} />
                      <input type="hidden" name="location_code" value={location.code} />
                      <input type="hidden" name="part_id" value={row.part_id} />
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        defaultValue={1}
                        required
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-gray-900 text-white text-sm px-3 py-1.5 hover:bg-gray-700"
                      >
                        Pull
                      </button>
                    </form>
                    <form action={addStock} className="flex items-center gap-1">
                      <input type="hidden" name="location_id" value={location.id} />
                      <input type="hidden" name="location_code" value={location.code} />
                      <input type="hidden" name="part_id" value={row.part_id} />
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        defaultValue={1}
                        required
                        className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-brand-600 text-white text-sm px-3 py-1.5 hover:bg-brand-700"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Add an existing part here</h3>
          {partsNotHere.length === 0 ? (
            <p className="text-sm text-gray-500">
              Every known part is already stocked at this location.
            </p>
          ) : (
            <form action={addExistingPartToLocation} className="space-y-3">
              <input type="hidden" name="location_id" value={location.id} />
              <input type="hidden" name="location_code" value={location.code} />
              <select
                name="part_id"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Choose a part&hellip;</option>
                {partsNotHere.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ""}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="quantity"
                  min={1}
                  defaultValue={1}
                  required
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-brand-600 text-white text-sm py-2 hover:bg-brand-700"
                >
                  Add to this location
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Add a brand new part</h3>
          <form action={addNewPartToLocation} className="space-y-3" encType="multipart/form-data">
            <input type="hidden" name="location_id" value={location.id} />
            <input type="hidden" name="location_code" value={location.code} />
            <input
              type="text"
              name="name"
              placeholder="Part name"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="sku"
              placeholder="SKU / part number (optional)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              className="w-full text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                name="quantity"
                min={0}
                defaultValue={1}
                className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="flex-1 rounded-md bg-gray-900 text-white text-sm py-2 hover:bg-gray-700"
              >
                Create part
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
