import type { Database } from "@/integrations/supabase/types";

export type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];
export type AppPermission = Database["public"]["Enums"]["app_permission"];
export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];

export const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG"] as const;
export const TRANSMISSIONS = ["Automatic", "Manual", "CVT"] as const;
export const BODY_TYPES = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Pickup",
  "Minivan",
  "Van",
  "Coupe",
  "Convertible",
  "Wagon",
  "Bus",
] as const;
export const CONDITIONS = ["Brand New", "Foreign Used", "Ghana Used"] as const;
export const DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"] as const;

export const VEHICLE_STATUSES: { value: VehicleStatus; label: string; description: string }[] = [
  { value: "draft", label: "Draft", description: "Being prepared, not public" },
  { value: "available", label: "Available", description: "For sale and shown publicly" },
  { value: "reserved", label: "Reserved", description: "Temporarily on hold" },
  { value: "sold", label: "Sold", description: "Sold and hidden from the public" },
  { value: "withdrawn", label: "Withdrawn", description: "Removed from sale" },
  { value: "archived", label: "Archived", description: "Kept for internal records" },
];

export const STATUS_LABEL: Record<VehicleStatus, string> = Object.fromEntries(
  VEHICLE_STATUSES.map((s) => [s.value, s.label]),
) as Record<VehicleStatus, string>;

export const PERMISSIONS: { value: AppPermission; label: string; description: string }[] = [
  { value: "add_vehicles", label: "Add vehicles", description: "Create new listings" },
  { value: "edit_vehicles", label: "Edit vehicles", description: "Change specifications and status" },
  { value: "manage_photos", label: "Manage photographs", description: "Upload, reorder and remove photos" },
  { value: "update_prices", label: "Update prices", description: "Change selling prices" },
  { value: "mark_sold", label: "Mark as sold", description: "Move vehicles to Sold" },
  { value: "manage_featured", label: "Manage featured", description: "Choose homepage features" },
  { value: "manage_enquiries", label: "Manage enquiries", description: "Record and follow up enquiries" },
];

export const ENQUIRY_STATUSES: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow up" },
  { value: "inspection_booked", label: "Inspection booked" },
  { value: "won", label: "Sold / won" },
  { value: "lost", label: "Lost" },
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently added" },
  { value: "price_asc", label: "Price: lowest first" },
  { value: "price_desc", label: "Price: highest first" },
  { value: "year_desc", label: "Newest year" },
  { value: "year_asc", label: "Oldest year" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
