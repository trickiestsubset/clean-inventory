"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customAlphabet } from "nanoid";
import { photoBucket, supabaseServer } from "@/lib/supabaseServer";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 7);

function withError(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

// ---------- Locations ----------

export async function createLocation(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!name) withError("/locations", "Name is required.");

  const sb = supabaseServer();
  const code = nanoid();
  const { error } = await sb.from("locations").insert({ name, notes: notes || null, code });
  if (error) withError("/locations", error.message);

  revalidatePath("/locations");
  redirect("/locations");
}

// ---------- Parts ----------

async function uploadPhotoIfPresent(formData: FormData): Promise<string | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;

  const sb = supabaseServer();
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${nanoid()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage.from(photoBucket()).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = sb.storage.from(photoBucket()).getPublicUrl(path);
  return data.publicUrl;
}

export async function createPart(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) withError("/parts", "Name is required.");

  let photo_url: string | null = null;
  try {
    photo_url = await uploadPhotoIfPresent(formData);
  } catch (e) {
    withError("/parts", (e as Error).message);
  }

  const sb = supabaseServer();
  const { error } = await sb.from("parts").insert({
    name,
    sku: sku || null,
    description: description || null,
    photo_url,
  });
  if (error) withError("/parts", error.message);

  revalidatePath("/parts");
  redirect("/parts");
}

export async function updatePart(formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const backPath = `/parts/${id}`;
  if (!id || !name) withError(backPath, "Name is required.");

  let photo_url: string | undefined;
  try {
    const uploaded = await uploadPhotoIfPresent(formData);
    if (uploaded) photo_url = uploaded;
  } catch (e) {
    withError(backPath, (e as Error).message);
  }

  const sb = supabaseServer();
  const update: Record<string, unknown> = {
    name,
    sku: sku || null,
    description: description || null,
  };
  if (photo_url) update.photo_url = photo_url;

  const { error } = await sb.from("parts").update(update).eq("id", id);
  if (error) withError(backPath, error.message);

  revalidatePath("/parts");
  revalidatePath(backPath);
  redirect(backPath);
}

// ---------- Stock movements ----------

async function applyStockChange(args: {
  locationId: string;
  partId: string;
  delta: number;
  reason: "add" | "pull" | "initial" | "adjust";
  note?: string;
}): Promise<string | null> {
  const sb = supabaseServer();
  const { error } = await sb.rpc("apply_stock_change", {
    p_location_id: args.locationId,
    p_part_id: args.partId,
    p_delta: args.delta,
    p_reason: args.reason,
    p_note: args.note || null,
  });
  return error ? error.message : null;
}

export async function pullStock(formData: FormData) {
  const locationId = String(formData.get("location_id") || "");
  const partId = String(formData.get("part_id") || "");
  const qty = Number(formData.get("quantity") || 0);
  const locationCode = String(formData.get("location_code") || "");
  const backPath = `/l/${locationCode}`;
  if (!locationId || !partId || !Number.isFinite(qty) || qty <= 0) {
    withError(backPath, "Enter a quantity greater than 0.");
  }

  const err = await applyStockChange({
    locationId,
    partId,
    delta: -Math.abs(Math.round(qty)),
    reason: "pull",
  });
  if (err) withError(backPath, err);

  revalidatePath(backPath);
  redirect(backPath);
}

export async function addStock(formData: FormData) {
  const locationId = String(formData.get("location_id") || "");
  const partId = String(formData.get("part_id") || "");
  const qty = Number(formData.get("quantity") || 0);
  const locationCode = String(formData.get("location_code") || "");
  const backPath = `/l/${locationCode}`;
  if (!locationId || !partId || !Number.isFinite(qty) || qty <= 0) {
    withError(backPath, "Enter a quantity greater than 0.");
  }

  const err = await applyStockChange({
    locationId,
    partId,
    delta: Math.abs(Math.round(qty)),
    reason: "add",
  });
  if (err) withError(backPath, err);

  revalidatePath(backPath);
  redirect(backPath);
}

export async function addExistingPartToLocation(formData: FormData) {
  const locationId = String(formData.get("location_id") || "");
  const partId = String(formData.get("part_id") || "");
  const qty = Number(formData.get("quantity") || 0);
  const locationCode = String(formData.get("location_code") || "");
  const backPath = `/l/${locationCode}`;
  if (!locationId || !partId) withError(backPath, "Choose a part.");
  if (!Number.isFinite(qty) || qty <= 0) withError(backPath, "Enter a quantity greater than 0.");

  const err = await applyStockChange({
    locationId,
    partId,
    delta: Math.abs(Math.round(qty)),
    reason: "initial",
    note: "Added to this location",
  });
  if (err) withError(backPath, err);

  revalidatePath(backPath);
  redirect(backPath);
}

export async function addNewPartToLocation(formData: FormData) {
  const locationId = String(formData.get("location_id") || "");
  const locationCode = String(formData.get("location_code") || "");
  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const qty = Number(formData.get("quantity") || 0);
  const backPath = `/l/${locationCode}`;
  if (!locationId || !name) withError(backPath, "Name is required.");
  if (!Number.isFinite(qty) || qty < 0) withError(backPath, "Quantity can't be negative.");

  let photo_url: string | null = null;
  try {
    photo_url = await uploadPhotoIfPresent(formData);
  } catch (e) {
    withError(backPath, (e as Error).message);
  }

  const sb = supabaseServer();
  const { data: part, error } = await sb
    .from("parts")
    .insert({ name, sku: sku || null, description: description || null, photo_url })
    .select()
    .single();
  if (error) withError(backPath, error.message);

  if (qty > 0) {
    const err = await applyStockChange({
      locationId,
      partId: part.id,
      delta: Math.round(qty),
      reason: "initial",
      note: "New part",
    });
    if (err) withError(backPath, err);
  }

  revalidatePath(backPath);
  revalidatePath("/parts");
  redirect(backPath);
}
