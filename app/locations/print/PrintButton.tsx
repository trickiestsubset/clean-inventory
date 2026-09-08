"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-gray-900 text-white text-sm px-4 py-2 hover:bg-gray-700"
    >
      Print
    </button>
  );
}
