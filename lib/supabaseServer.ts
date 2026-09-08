import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. Never import this
// from a client component or expose the service role key to the browser.
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export function supabaseServer() {
  const url = getEnv("SUPABASE_URL");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function photoBucket(): string {
  return process.env.SUPABASE_PHOTO_BUCKET || "part-photos";
}
