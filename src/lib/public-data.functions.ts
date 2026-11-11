import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient } from "./public-client.server";
import type { PublicVehicle, SiteSettings } from "./public-types";

const VEHICLE_SELECT =
  "id, reference, slug, make, model, year, trim, price, mileage, engine_capacity, fuel_type, transmission, body_type, exterior_colour, interior_colour, drivetrain, doors, condition, country_of_import, description, features, status, is_featured, published_at, vehicle_images(id, url, position, alt)";

type Row = Omit<PublicVehicle, "images" | "price"> & {
  price: number | string;
  vehicle_images: { id: string; url: string; position: number; alt: string | null }[] | null;
};

function toDto(row: Row): PublicVehicle {
  const { vehicle_images, ...rest } = row;
  return {
    ...rest,
    price: Number(row.price),
    features: row.features ?? [],
    images: [...(vehicle_images ?? [])].sort((a, b) => a.position - b.position),
  };
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async (): Promise<SiteSettings> => {
  const sb = createPublicClient();
  const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("settings", error);
  return (
    data ?? {
      id: 1,
      dealership_name: "OP Motors",
      tagline: "Premium vehicles, honestly presented.",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      opening_hours: "",
      about_text: "",
      updated_at: new Date().toISOString(),
    }
  );
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicClient();
  const [featured, recent, count] = await Promise.all([
    sb
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("status", "available")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(6),
    sb
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("status", "available")
      .order("published_at", { ascending: false })
      .limit(8),
    sb.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "available"),
  ]);
  if (featured.error) throw new Error(featured.error.message);
  if (recent.error) throw new Error(recent.error.message);
  return {
    featured: (featured.data as unknown as Row[]).map(toDto),
    recent: (recent.data as unknown as Row[]).map(toDto),
    availableCount: count.count ?? 0,
  };
});

const inventorySchema = z.object({
  q: z.string().max(80).optional(),
  make: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  minYear: z.number().int().optional(),
  maxYear: z.number().int().optional(),
  fuel: z.string().max(30).optional(),
  transmission: z.string().max(30).optional(),
  body: z.string().max(30).optional(),
  condition: z.string().max(30).optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "year_desc", "year_asc"]).optional(),
});
export type InventoryFilters = z.infer<typeof inventorySchema>;

export const listInventory = createServerFn({ method: "GET" })
  .inputValidator((input: InventoryFilters) => inventorySchema.parse(input))
  .handler(async ({ data: f }) => {
    const sb = createPublicClient();
    // Only Available vehicles appear in the public inventory.
    let query = sb.from("vehicles").select(VEHICLE_SELECT).eq("status", "available");
    if (f.make) query = query.eq("make", f.make);
    if (f.model) query = query.eq("model", f.model);
    if (f.minPrice != null) query = query.gte("price", f.minPrice);
    if (f.maxPrice != null) query = query.lte("price", f.maxPrice);
    if (f.minYear != null) query = query.gte("year", f.minYear);
    if (f.maxYear != null) query = query.lte("year", f.maxYear);
    if (f.fuel) query = query.eq("fuel_type", f.fuel);
    if (f.transmission) query = query.eq("transmission", f.transmission);
    if (f.body) query = query.eq("body_type", f.body);
    if (f.condition) query = query.eq("condition", f.condition);
    const q = f.q?.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim();
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean).slice(0, 5);
      for (const term of terms) {
        const ors = [
          `make.ilike.%${term}%`,
          `model.ilike.%${term}%`,
          `trim.ilike.%${term}%`,
          `reference.ilike.%${term}%`,
          `body_type.ilike.%${term}%`,
          `exterior_colour.ilike.%${term}%`,
        ];
        if (/^\d{4}$/.test(term)) ors.push(`year.eq.${term}`);
        query = query.or(ors.join(","));
      }
    }
    switch (f.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "year_desc":
        query = query.order("year", { ascending: false });
        break;
      case "year_asc":
        query = query.order("year", { ascending: true });
        break;
      default:
        query = query.order("published_at", { ascending: false });
    }
    const { data, error } = await query.limit(200);
    if (error) throw new Error(error.message);
    return (data as unknown as Row[]).map(toDto);
  });

export const getInventoryFacets = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("vehicles")
    .select("make, model, year, price, fuel_type, transmission, body_type, condition")
    .eq("status", "available")
    .limit(1000);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const modelsByMake: Record<string, string[]> = {};
  for (const r of rows) (modelsByMake[r.make] ??= []).push(r.model);
  for (const k of Object.keys(modelsByMake)) modelsByMake[k] = uniq(modelsByMake[k] ?? []);
  const years = rows.map((r) => r.year);
  return {
    makes: uniq(rows.map((r) => r.make)),
    modelsByMake,
    fuels: uniq(rows.map((r) => r.fuel_type)),
    transmissions: uniq(rows.map((r) => r.transmission)),
    bodies: uniq(rows.map((r) => r.body_type)),
    conditions: uniq(rows.map((r) => r.condition)),
    minYear: years.length ? Math.min(...years) : 2000,
    maxYear: years.length ? Math.max(...years) : new Date().getFullYear(),
  };
});

export const getVehicleBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }) => {
    const sb = createPublicClient();
    const { data: row, error } = await sb
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("slug", data.slug)
      .in("status", ["available", "reserved"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const vehicle = toDto(row as unknown as Row);
    const { data: similar } = await sb
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("status", "available")
      .neq("id", vehicle.id)
      .or(`body_type.eq.${vehicle.body_type},make.eq.${vehicle.make}`)
      .order("published_at", { ascending: false })
      .limit(3);
    return { vehicle, similar: ((similar ?? []) as unknown as Row[]).map(toDto) };
  });

export const getVehiclesByIds = createServerFn({ method: "GET" })
  .inputValidator((input: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return [];
    const sb = createPublicClient();
    const { data: rows, error } = await sb
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .in("id", data.ids)
      .in("status", ["available", "reserved"]);
    if (error) throw new Error(error.message);
    const list = ((rows ?? []) as unknown as Row[]).map(toDto);
    return data.ids.map((id) => list.find((v) => v.id === id)).filter((v): v is PublicVehicle => !!v);
  });

export const listRecentlyAdded = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("vehicles")
    .select(VEHICLE_SELECT)
    .eq("status", "available")
    .order("published_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toDto);
});
