import type { Database } from "@/integrations/supabase/types";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

export type VehicleImage = { id: string; url: string; position: number; alt: string | null };

export type PublicVehicle = Pick<
  VehicleRow,
  | "id"
  | "reference"
  | "slug"
  | "make"
  | "model"
  | "year"
  | "trim"
  | "mileage"
  | "engine_capacity"
  | "fuel_type"
  | "transmission"
  | "body_type"
  | "exterior_colour"
  | "interior_colour"
  | "drivetrain"
  | "doors"
  | "condition"
  | "country_of_import"
  | "description"
  | "features"
  | "status"
  | "is_featured"
  | "published_at"
> & { price: number; images: VehicleImage[] };

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];
