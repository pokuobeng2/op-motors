import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, ShieldCheck, BadgeCheck, CalendarCheck } from "lucide-react";
import heroImage from "@/assets/hero-showroom.jpg";
import { SiteShell } from "@/components/site/SiteShell";
import { VehicleCard } from "@/components/site/VehicleCard";
import { Reveal } from "@/components/site/Reveal";
import { SmartImage } from "@/components/site/SmartImage";
import { FavouriteButton } from "@/components/site/FavouriteButton";
import { Button } from "@/components/ui/button";
import { homeQuery, settingsQuery } from "@/lib/queries";
import { formatMileage, formatPrice } from "@/lib/format";
import { generalEnquiryMessage, whatsappLink } from "@/lib/contact";
import type { PublicVehicle } from "@/lib/public-types";
import { buildMetaTags, DEFAULT_OG_IMAGE } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: buildMetaTags({
      title: "OP Motors — Premium vehicles in Accra, Ghana",
      description:
        "Explore hand-picked SUVs, sedans and pickups at OP Motors. Transparent prices, WhatsApp enquiries and easy inspection requests.",
      image: DEFAULT_OG_IMAGE,
      imageAlt: "OP Motors luxury automobile showroom in Accra, Ghana",
      url: "/",
    }),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div className="container-page py-24 text-center text-muted-foreground" role="alert">
      We couldn't load the showroom right now. {error instanceof Error ? error.message : ""}
    </div>
  ),
});

function HomePage() {
  const { data } = useSuspenseQuery(homeQuery);
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const [lead, ...rest] = data.featured;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImage}
            alt="Black Range Rover in a bright, minimalist showroom"
            width={1920}
            height={1088}
            className="h-full w-full animate-slow-zoom object-cover object-[75%_center] sm:object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent sm:bg-hero-fade" />
        </div>
        <div className="container-page flex min-h-[62vh] flex-col justify-center pb-12 pt-20 sm:min-h-[74vh] sm:pb-16 sm:pt-28 md:min-h-[86vh] md:pb-20 md:pt-36">
          <h1
            className="max-w-2xl animate-fade-up text-3xl font-semibold leading-[1.08] tracking-tight min-[480px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ animationDelay: "100ms" }}
          >
            Drive something exceptional.
          </h1>
          <p
            className="mt-3 max-w-md animate-fade-up text-sm text-muted-foreground sm:mt-4 sm:text-base md:mt-5 md:text-lg"
            style={{ animationDelay: "180ms" }}
          >
            Hand-picked, inspected vehicles — priced transparently.
          </p>
          <div className="mt-7 flex animate-fade-up flex-wrap items-center gap-3 sm:mt-9 md:mt-11" style={{ animationDelay: "260ms" }}>
            <Button asChild variant="hero" size="lg" className="h-11 px-5 text-sm sm:h-14 sm:px-8 sm:text-base">
              <Link to="/inventory">
                Explore inventory <ArrowRight className="size-4" />
              </Link>
            </Button>
            {settings.whatsapp && (
              <Button asChild variant="glass" size="lg" className="h-11 px-5 text-sm sm:h-14 sm:px-8 sm:text-base">
                <a href={whatsappLink(settings.whatsapp, generalEnquiryMessage())} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> Talk to us
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      {lead && (
        <section className="container-page pt-16 sm:pt-20 md:pt-24">
          <Reveal className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl md:text-5xl">The showroom selection.</h2>
            </div>
            <Link to="/inventory" className="hidden text-sm font-semibold hover:underline sm:block">
              View all →
            </Link>
          </Reveal>
          <Reveal className="mt-8 sm:mt-10">
            <FeaturedLead vehicle={lead} />
          </Reveal>
          {rest.length > 0 && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {rest.map((v, i) => (
                <Reveal key={v.id} delay={i * 80}>
                  <VehicleCard vehicle={v} />
                </Reveal>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recently added */}
      <section className="container-page pt-16 sm:pt-20 md:pt-28">
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Recently added</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl md:text-5xl">Fresh on the floor.</h2>
          </div>
          <Link to="/recent" className="text-sm font-semibold hover:underline">
            See all →
          </Link>
        </Reveal>
        <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
          {data.recent.map((v, i) => (
            <Reveal key={v.id} delay={(i % 4) * 70} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] md:w-auto">
              <VehicleCard vehicle={v} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why OP Motors */}
      <section className="container-page pt-16 sm:pt-20 md:pt-28">
        <Reveal>
          <p className="eyebrow">Why OP Motors</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold sm:text-3xl md:text-5xl">Buying a car should feel this simple.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Inspected vehicles", text: "Every car is checked by our team before it reaches the showroom." },
            { icon: BadgeCheck, title: "Honest pricing", text: "Clear, upfront pricing on every listing — no hidden fees or surprises." },
            { icon: CalendarCheck, title: "Inspect on your schedule", text: "Pick a date and time, and we'll confirm your viewing on WhatsApp." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 100} className="rounded-3xl bg-surface p-8">
              <f.icon className="h-7 w-7 text-gold" />
              <h3 className="mt-6 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="container-page pt-16 sm:pt-20 md:pt-28">
        <Reveal className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-ink text-ink-foreground md:grid-cols-2">
          <div className="p-6 sm:p-10 md:p-16">
            <p className="eyebrow text-ink-foreground/60">About {settings.dealership_name}</p>
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">A dealership built on trust.</h2>
            <p className="mt-5 leading-relaxed text-ink-foreground/70">{settings.about_text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/about">Our story</Link>
              </Button>
              <Button asChild variant="link" size="lg" className="text-ink-foreground">
                <Link to="/contact">Visit the showroom →</Link>
              </Button>
            </div>
          </div>
          <img
            src="/images/cars/interior-luxury.jpg"
            alt="Cream leather interior of a luxury SUV"
            loading="lazy"
            width={1600}
            height={1072}
            className="h-full min-h-72 w-full object-cover"
          />
        </Reveal>
      </section>
    </SiteShell>
  );
}

function FeaturedLead({ vehicle }: { vehicle: PublicVehicle }) {
  const img = vehicle.images[0];
  return (
    <Link
      to="/inventory/$slug"
      params={{ slug: vehicle.slug }}
      className="group relative block overflow-hidden rounded-[2rem] bg-surface shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SmartImage
        src={img?.url ?? "/placeholder.svg"}
        alt={img?.alt ?? `${vehicle.make} ${vehicle.model}`}
        loading="lazy"
        width={1600}
        height={1072}
        wrapperClassName="aspect-[4/3] md:aspect-[21/9]"
        className="img-zoom h-full w-full object-cover group-hover:scale-[1.04]"
      />
      <div className="bg-ink-fade absolute inset-0" />
      <FavouriteButton vehicleId={vehicle.id} className="absolute right-5 top-5" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 text-ink-foreground md:flex-row md:items-end md:justify-between md:p-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-foreground/70">
            {vehicle.year} · {formatMileage(vehicle.mileage)} · {vehicle.transmission}
          </p>
          <h3 className="mt-2 text-3xl font-semibold md:text-5xl">
            {vehicle.make} {vehicle.model}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-display text-2xl font-semibold md:text-3xl">{formatPrice(vehicle.price)}</p>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-background text-foreground transition-transform duration-500 group-hover:translate-x-1">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
