export type Location = {
  id: string;
  code: string;
  name: string;
  notes: string | null;
  created_at: string;
};

export type Part = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

export type InventoryRow = {
  location_id: string;
  part_id: string;
  quantity: number;
  updated_at: string;
  part: Part;
};

export type Movement = {
  id: string;
  location_id: string | null;
  part_id: string | null;
  delta: number;
  reason: "initial" | "add" | "pull" | "adjust";
  note: string | null;
  created_at: string;
};
