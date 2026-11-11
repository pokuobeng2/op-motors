/** Formatting helpers shared by the showroom and the admin dashboard. */

/** All prices are shown in Ghana cedis, e.g. "GH₵ 1,850,000". */
export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return "GH₵ —";
  const hasPesewas = Math.round(n * 100) % 100 !== 0;
  return `GH₵ ${n.toLocaleString("en-GH", {
    minimumFractionDigits: hasPesewas ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMileage(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return "—";
  return `${km.toLocaleString("en-GH")} km`;
}

export function vehicleTitle(v: { year: number; make: string; model: string }): string {
  return `${v.year} ${v.make} ${v.model}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
