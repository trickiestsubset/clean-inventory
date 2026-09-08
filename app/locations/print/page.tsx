import { listLocations } from "@/lib/data";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function PrintLabelsPage() {
  const locations = await listLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold text-gray-900">Print QR labels</h1>
        <PrintButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 print:grid-cols-3">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="flex flex-col items-center text-center gap-2 border border-dashed border-gray-300 rounded-lg p-4 break-inside-avoid"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${loc.code}`}
              alt={`QR code for ${loc.name}`}
              width={160}
              height={160}
            />
            <p className="font-medium text-gray-900">{loc.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
