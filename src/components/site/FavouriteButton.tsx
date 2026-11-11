import { Heart } from "lucide-react";
import { useFavourites } from "@/lib/favourites";
import { cn } from "@/lib/utils";

export function FavouriteButton({
  vehicleId,
  className,
  label,
}: {
  vehicleId: string;
  className?: string;
  label?: boolean;
}) {
  const { isFavourite, toggle } = useFavourites();
  const active = isFavourite(vehicleId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(vehicleId);
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from favourites" : "Save to favourites"}
      className={cn(
        "glass inline-flex items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        label ? "h-12 px-5" : "h-10 w-10",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4 transition-all", active ? "fill-gold text-gold scale-110" : "text-foreground")} />
      {label && <span>{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
