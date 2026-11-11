import { Link } from "@tanstack/react-router";
import { Gauge, Settings2, Fuel } from "lucide-react";
import type { PublicVehicle } from "@/lib/public-types";
import { formatMileage, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { FavouriteButton } from "./FavouriteButton";
import { SmartImage } from "./SmartImage";
import { cn } from "@/lib/utils";

function isNew(publishedAt: string | null) {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export function VehicleCard({ vehicle, className }: { vehicle: PublicVehicle; className?: string }) {
  const main = vehicle.images[0];
  return (
    <Link
      to="/inventory/$slug"
      params={{ slug: vehicle.slug }}
      className={cn(
        "group block overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative">
        <SmartImage
          src={main?.url ?? "/placeholder.svg"}
          alt={main?.alt ?? `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          loading="lazy"
          width={1600}
          height={1072}
          wrapperClassName="aspect-[3/2]"
          className="img-zoom h-full w-full object-cover group-hover:scale-[1.06]"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {vehicle.status === "reserved" ? (
            <Badge variant="reserved">Reserved</Badge>
          ) : isNew(vehicle.published_at) ? (
            <Badge variant="glass">Just added</Badge>
          ) : null}
        </div>
        <FavouriteButton vehicleId={vehicle.id} className="absolute right-3 top-3" />
      </div>
      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {vehicle.year} · {vehicle.condition}
            </p>
            <span className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground ring-1 ring-border/50">
              Stock #{vehicle.reference}
            </span>
          </div>
          <h3 className="mt-1 truncate text-lg font-semibold">
            {vehicle.make} {vehicle.model}
            {vehicle.trim && <span className="font-normal text-muted-foreground"> {vehicle.trim}</span>}
          </h3>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" /> {formatMileage(vehicle.mileage)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> {vehicle.transmission}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5" /> {vehicle.fuel_type}
          </span>
        </div>
        <div className="flex items-end justify-between border-t border-border pt-4">
          <p className="font-display text-xl font-semibold">{formatPrice(vehicle.price)}</p>
          <span className="text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function VehicleGrid({ vehicles }: { vehicles: PublicVehicle[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v, i) => (
        <div key={v.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
          <VehicleCard vehicle={v} />
        </div>
      ))}
    </div>
  );
}
