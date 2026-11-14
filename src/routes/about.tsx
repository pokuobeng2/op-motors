import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell, PageHeading } from "@/components/site/SiteShell";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";
import { buildMetaTags, DEFAULT_OG_IMAGE } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: buildMetaTags({
      title: "About OP Motors — Trusted car dealership in Accra",
      description:
        "Learn about OP Motors: how we select, inspect and price vehicles, and the services we offer in Ghana.",
      image: DEFAULT_OG_IMAGE,
      imageAlt: "About OP Motors",
      url: "/about",
    }),
  }),
  component: AboutPage,
});

const SERVICES = [
  { title: "Vehicle sales", text: "A curated range of brand-new and foreign-used SUVs, sedans and pickups." },
  { title: "Pre-sale inspection", text: "Each vehicle is checked by our technicians before it is listed." },
  { title: "Viewings & test drives", text: "Book an inspection on WhatsApp at a time that suits you." },
  { title: "Paperwork support", text: "We guide you through registration and documentation after purchase." },
];

function AboutPage() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  return (
    <SiteShell>
      <PageHeading eyebrow={`About ${s.dealership_name}`} title="Fewer cars. Better cars.">
        {s.tagline}
      </PageHeading>
      <div className="container-page">
        <Reveal className="overflow-hidden rounded-[2rem]">
          <img
            src="/images/cars/land-cruiser.jpg"
            alt="White Toyota Land Cruiser in the studio"
            loading="lazy"
            width={1600}
            height={1072}
            className="aspect-[21/9] w-full object-cover"
          />
        </Reveal>
        <div className="mt-16 grid gap-12 md:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <h2 className="text-3xl font-semibold md:text-4xl">Who we are</h2>
          </Reveal>
          <Reveal>
            <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{s.about_text}</p>
          </Reveal>
        </div>
        <div className="mt-20">
          <Reveal>
            <h2 className="text-3xl font-semibold md:text-4xl">What we offer</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {SERVICES.map((x, i) => (
              <Reveal key={x.title} delay={i * 80} className="rounded-3xl bg-surface p-8">
                <span className="font-display text-sm font-semibold text-gold">0{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{x.title}</h3>
                <p className="mt-2 text-muted-foreground">{x.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="mt-20 flex flex-col items-start gap-6 rounded-[2rem] bg-ink p-10 text-ink-foreground md:flex-row md:items-center md:justify-between md:p-14">
          <h2 className="max-w-lg text-3xl font-semibold">Ready to find your next car?</h2>
          <Button asChild variant="gold" size="xl">
            <Link to="/inventory">Browse inventory</Link>
          </Button>
        </Reveal>
      </div>
    </SiteShell>
  );
}
