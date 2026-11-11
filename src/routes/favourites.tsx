import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { SiteShell, PageHeading } from "@/components/site/SiteShell";
import { VehicleGrid } from "@/components/site/VehicleCard";
import { Button } from "@/components/ui/button";
import { useFavourites } from "@/lib/favourites";
import { favouritesQuery } from "@/lib/queries";

export const Route = createFileRoute("/favourites")({
  head: () => ({
    meta: [
      { title: "Your favourites — OP Motors" },
      { name: "description", content: "Vehicles you've saved at OP Motors. No account needed." },
      { property: "og:title", content: "Your favourites — OP Motors" },
      { property: "og:description", content: "Vehicles you've saved at OP Motors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FavouritesPage,
});

function FavouritesPage() {
  const { ids } = useFavourites();
  const { data = [], isLoading } = useQuery({ ...favouritesQuery(ids), enabled: ids.length > 0 });
  const unavailable = ids.length - data.length;

  return (
    <SiteShell>
      <PageHeading eyebrow="Favourites" title="Your saved vehicles.">
        Saved on this device — no account needed. Clearing your browser data will remove them.
      </PageHeading>
      <div className="container-page">
        {ids.length === 0 ? (
          <div className="rounded-3xl bg-surface px-6 py-20 text-center">
            <Heart className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mt-4 text-2xl font-semibold">Nothing saved yet.</h2>
            <p className="mt-2 text-muted-foreground">Tap the heart on any vehicle to keep it here.</p>
            <Button asChild variant="hero" size="lg" className="mt-8">
              <Link to="/inventory">Browse inventory</Link>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ids.slice(0, 3).map((id) => (
              <div key={id} className="skeleton-shimmer aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {data.length > 0 && <VehicleGrid vehicles={data} />}
            {unavailable > 0 && !isLoading && (
              <p className="mt-8 text-sm text-muted-foreground">
                {unavailable} saved {unavailable === 1 ? "vehicle is" : "vehicles are"} no longer available.
              </p>
            )}
          </>
        )}
      </div>
    </SiteShell>
  );
}
