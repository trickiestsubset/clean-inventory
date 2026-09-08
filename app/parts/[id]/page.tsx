import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocationsForPart, getMovementsForPart, getPart } from "@/lib/data";
import { updatePart } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function PartDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const part = await getPart(params.id);
  if (!part) notFound();

  const [locations, movements] = await Promise.all([
    getLocationsForPart(part.id),
    getMovementsForPart(part.id),
  ]);
  const total = locations.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        <Link href="/parts" className="hover:underline">
          Parts
        </Link>{" "}
        / {part.name}
      </p>

      {searchParams.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {searchParams.error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
        {part.photo_url ? (
          <Image
            src={part.photo_url}
            alt={part.name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
            No photo
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{part.name}</h1>
          {part.sku && <p className="text-sm text-gray-500">SKU {part.sku}</p>}
          {part.description && <p className="text-sm text-gray-600 mt-1">{part.description}</p>}
          <p className="text-sm font-medium text-brand-700 mt-2">{total} total in stock</p>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Where it is
        </h2>
        {locations.length === 0 ? (
          <p className="text-sm text-gray-500">Not currently stocked anywhere.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {locations.map(({ location, quantity }) => (
              <li key={location.id}>
                <Link
                  href={`/l/${location.code}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 hover:border-brand-300"
                >
                  <span className="text-gray-900">{location.name}</span>
                  <span className="font-semibold text-brand-700">{quantity}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {movements.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Recent activity
          </h2>
          <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {movements.map((m) => (
              <li key={m.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {new Date(m.created_at).toLocaleString()} &middot;{" "}
                  {m.location?.name || "(deleted location)"} &middot; {m.reason}
                </span>
                <span className={m.delta >= 0 ? "text-brand-700 font-medium" : "text-red-600 font-medium"}>
                  {m.delta >= 0 ? "+" : ""}
                  {m.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Edit part
        </h2>
        <form
          action={updatePart}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
          encType="multipart/form-data"
        >
          <input type="hidden" name="id" value={part.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              name="name"
              defaultValue={part.name}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="sku"
              defaultValue={part.sku || ""}
              placeholder="SKU / part number"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="description"
            defaultValue={part.description || ""}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Replace photo (optional)</label>
            <input type="file" name="photo" accept="image/*" capture="environment" className="text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gray-900 text-white text-sm px-4 py-2 hover:bg-gray-700"
          >
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}
