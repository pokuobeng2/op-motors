import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Check, MessageCircle, Phone } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Gallery } from "@/components/site/Gallery";
import { InspectionDialog } from "@/components/site/InspectionDialog";
import { FavouriteButton } from "@/components/site/FavouriteButton";
import { VehicleCard } from "@/components/site/VehicleCard";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { settingsQuery, vehicleQuery } from "@/lib/queries";
import { formatMileage, formatPrice } from "@/lib/format";
import { enquiryMessage, telLink, whatsappLink } from "@/lib/contact";
import { buildMetaTags } from "@/lib/seo";

export const Route = createFileRoute("/inventory/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(vehicleQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Vehicle unavailable — OP Motors" }, { name: "robots", content: "noindex" }] };
    }
    const v = loaderData.vehicle;
    const title = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""} (Stock #${v.reference}) — ${formatPrice(v.price)} | OP Motors`;
    const description = `${v.year} ${v.make} ${v.model}, ${formatMileage(v.mileage)}, ${v.transmission}, ${v.fuel_type}. ${v.description || "View full vehicle specifications, photos, and book an inspection."}`.slice(0, 160);
    const mainImage = v.images[0];

    return {
      meta: buildMetaTags({
        title,
        description,
        image: mainImage?.url,
        imageAlt: mainImage?.alt || `${v.year} ${v.make} ${v.model} at OP Motors`,
        url: `/inventory/${v.slug}`,
        type: "product",
      }),
    };
  },
  component: VehiclePage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="container-page py-32 text-center">
        <p className="eyebrow">No longer listed</p>
        <h1 className="mt-3 text-4xl font-semibold">This vehicle is no longer available.</h1>
        <p className="mt-3 text-muted-foreground">It may have been sold. Take a look at what's in the showroom now.</p>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to="/inventory">Browse inventory</Link>
        </Button>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <div className="container-page py-24 text-center text-muted-foreground" role="alert">
      We couldn't load this vehicle. {error instanceof Error ? error.message : ""}
    </div>
  ),
});

function VehiclePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(vehicleQuery(slug));
  const { data: settings } = useSuspenseQuery(settingsQuery);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [slug]);

  if (!data) return null;
  const { vehicle: v, similar } = data;
  const title = `${v.year} ${v.make} ${v.model}`;
  const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;

  const specs: [string, string | number | null | undefined][] = [
    ["Make", v.make],
    ["Model", v.model],
    ["Year", v.year],
    ["Trim / variant", v.trim],
    ["Mileage", formatMileage(v.mileage)],
    ["Engine", v.engine_capacity],
    ["Fuel type", v.fuel_type],
    ["Transmission", v.transmission],
    ["Body type", v.body_type],
    ["Drivetrain", v.drivetrain],
    ["Doors", v.doors],
    ["Exterior colour", v.exterior_colour],
    ["Interior colour", v.interior_colour],
    ["Condition", v.condition],
    ["Imported from", v.country_of_import],
    ["Stock ID", v.reference],
  ];

  return (
    <SiteShell>
      <div className="container-page pt-8">
        <Link to="/inventory" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to inventory
        </Link>
      </div>
      <div className="container-page mt-4 sm:mt-6 grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="animate-fade-up">
          <Gallery images={v.images} title={title} />
        </div>
        <aside className="animate-fade-up lg:sticky lg:top-24 lg:self-start" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={v.status === "reserved" ? "reserved" : "available"}>
              {v.status === "reserved" ? "Reserved" : "Available"}
            </Badge>
            <span className="inline-flex items-center rounded-md bg-surface px-2.5 py-0.5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border">
              Stock ID: {v.reference}
            </span>
          </div>
          <h1 className="mt-2.5 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">
            {v.make} {v.model}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
            {v.year}
            {v.trim ? ` · ${v.trim}` : ""} · {v.condition}
          </p>
          <p className="mt-3.5 sm:mt-6 font-display text-2xl sm:text-3xl lg:text-4xl font-semibold">{formatPrice(v.price)}</p>
          {v.status === "reserved" && (
            <p className="mt-3 rounded-2xl bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
              This vehicle is currently reserved. Message us to join the waiting list.
            </p>
          )}
          <dl className="mt-5 sm:mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border">
            {[
              ["Mileage", formatMileage(v.mileage)],
              ["Transmission", v.transmission],
              ["Fuel", v.fuel_type],
              ["Engine", v.engine_capacity],
            ].map(([k, val]) => (
              <div key={k} className="bg-surface p-3 sm:p-4">
                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 sm:mt-1 text-sm sm:text-base font-semibold">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 grid gap-3">
            {settings.whatsapp && (
              <Button asChild variant="whatsapp" size="lg" className="w-full">
                <a href={whatsappLink(settings.whatsapp, enquiryMessage(v, pageUrl))} target="_blank" rel="noreferrer">
                  <MessageCircle /> Enquire on WhatsApp
                </a>
              </Button>
            )}
            <div className="grid grid-cols-[1fr_auto] gap-3">
              {settings.phone && (
                <Button asChild variant="hero" size="lg">
                  <a href={telLink(settings.phone)}>
                    <Phone /> Call {settings.phone}
                  </a>
                </Button>
              )}
              <FavouriteButton vehicleId={v.id} label />
            </div>
            {settings.whatsapp && <InspectionDialog vehicle={v} whatsapp={settings.whatsapp} />}
          </div>
        </aside>
      </div>

      <div className="container-page mt-20 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-14">
          <Reveal>
            <h2 className="text-2xl font-semibold md:text-3xl">Overview</h2>
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{v.description}</p>
          </Reveal>
          {v.features.length > 0 && (
            <Reveal>
              <h2 className="text-2xl font-semibold md:text-3xl">Special features</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {v.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                    <Check className="h-4 w-4 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
        <Reveal>
          <h2 className="text-2xl font-semibold md:text-3xl">Specifications</h2>
          <dl className="mt-6 divide-y divide-border rounded-2xl border border-border">
            {specs
              .filter(([, val]) => val !== null && val !== undefined && val !== "")
              .map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4 px-5 py-3.5 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold">{val}</dd>
                </div>
              ))}
          </dl>
        </Reveal>
      </div>

      {similar.length > 0 && (
        <section className="container-page mt-24">
          <Reveal>
            <h2 className="text-2xl font-semibold md:text-3xl">You might also like</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s, i) => (
              <Reveal key={s.id} delay={i * 80}>
                <VehicleCard vehicle={s} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
