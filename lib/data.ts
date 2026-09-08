import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";
import type { InventoryRow, Location, Movement, Part } from "@/lib/types";

export async function getLocationByCode(code: string): Promise<Location | null> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("locations").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  return data as Location | null;
}

export async function getLocationById(id: string): Promise<Location | null> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("locations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Location | null;
}

export async function listLocations(): Promise<Location[]> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("locations").select("*").order("name");
  if (error) throw error;
  return (data || []) as Location[];
}

export async function getInventoryForLocation(locationId: string): Promise<InventoryRow[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("inventory")
    .select("location_id, part_id, quantity, updated_at, part:parts(*)")
    .eq("location_id", locationId);
  if (error) throw error;
  const rows = (data || []) as unknown as InventoryRow[];
  return rows.sort((a, b) => a.part.name.localeCompare(b.part.name));
}

export async function listParts(query?: string): Promise<Part[]> {
  const sb = supabaseServer();
  let q = sb.from("parts").select("*").order("name");
  if (query && query.trim()) {
    const like = `%${query.trim()}%`;
    q = q.or(`name.ilike.${like},sku.ilike.${like},description.ilike.${like}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Part[];
}

export async function getPart(id: string): Promise<Part | null> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("parts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Part | null;
}

export async function getPartTotalQuantities(): Promise<Record<string, number>> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("inventory").select("part_id, quantity");
  if (error) throw error;
  const totals: Record<string, number> = {};
  for (const row of data || []) {
    totals[row.part_id] = (totals[row.part_id] || 0) + row.quantity;
  }
  return totals;
}

export async function getLocationsForPart(
  partId: string
): Promise<{ location: Location; quantity: number }[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("inventory")
    .select("quantity, location:locations(*)")
    .eq("part_id", partId)
    .gt("quantity", 0);
  if (error) throw error;
  const rows = (data || []) as unknown as { quantity: number; location: Location }[];
  return rows.sort((a, b) => a.location.name.localeCompare(b.location.name));
}

export async function getMovementsForPart(partId: string, limit = 20): Promise<
  (Movement & { location: Location | null })[]
> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("movements")
    .select("*, location:locations(*)")
    .eq("part_id", partId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as (Movement & { location: Location | null })[];
}

export async function getMovementsForLocation(
  locationId: string,
  limit = 30
): Promise<(Movement & { part: Part | null })[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("movements")
    .select("*, part:parts(*)")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as (Movement & { part: Part | null })[];
}
