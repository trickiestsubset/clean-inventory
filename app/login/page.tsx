import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next || "/";
  const hasError = searchParams.error === "1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-brand-100 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Clean Inventory</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the shared passcode to continue.</p>

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="passcode" className="sr-only">
              Passcode
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              autoFocus
              required
              placeholder="Passcode"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          {hasError && (
            <p className="text-sm text-red-600">That passcode isn&apos;t right. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 text-white font-medium py-2.5 hover:bg-brand-700 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
