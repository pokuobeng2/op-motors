import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell, PageHeading } from "@/components/site/SiteShell";
import { VehicleGrid } from "@/components/site/VehicleCard";
import { recentQuery } from "@/lib/queries";

export const Route = createFileRoute("/recent")({
  loader: ({ context }) => context.queryClient.ensureQueryData(recentQuery),
  head: () => ({
    meta: [
      { title: "Recently added vehicles — OP Motors" },
      { name: "description", content: "The newest arrivals at OP Motors, with the latest listings first." },
      { property: "og:title", content: "Recently added vehicles — OP Motors" },
      { property: "og:description", content: "The newest arrivals at OP Motors, latest first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecentPage,
  errorComponent: ({ error }) => (
    <div className="container-page py-24 text-center text-muted-foreground" role="alert">
      {error instanceof Error ? error.message : ""}
    </div>
  ),
});

function RecentPage() {
  const { data } = useSuspenseQuery(recentQuery);
  return (
    <SiteShell>
      <PageHeading eyebrow="Recently added" title="Just arrived.">
        The newest vehicles in our showroom, latest first.
      </PageHeading>
      <div className="container-page">
        {data.length ? <VehicleGrid vehicles={data} /> : <p className="text-muted-foreground">New stock coming soon.</p>}
      </div>
    </SiteShell>
  );
}
