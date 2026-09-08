import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { logout } from "./login/actions";

export const metadata: Metadata = {
  title: "Clean Inventory",
  description: "Scan a location, see what's there, pull or add parts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-gray-900">
              🧹 Clean Inventory
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-600">
              <Link href="/" className="hover:text-brand-700">
                Search
              </Link>
              <Link href="/locations" className="hover:text-brand-700">
                Locations
              </Link>
              <Link href="/parts" className="hover:text-brand-700">
                Parts
              </Link>
              <form action={logout}>
                <button type="submit" className="hover:text-brand-700">
                  Log out
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
