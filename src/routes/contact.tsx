import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteShell, PageHeading } from "@/components/site/SiteShell";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/queries";
import { generalEnquiryMessage, telLink, whatsappLink } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact OP Motors — WhatsApp, phone and showroom" },
      { name: "description", content: "Call, WhatsApp or visit the OP Motors showroom in Accra. Opening hours and directions." },
      { property: "og:title", content: "Contact OP Motors" },
      { property: "og:description", content: "Call, WhatsApp or visit our showroom in Accra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const items = [
    { icon: MapPin, label: "Showroom", value: s.address },
    { icon: Clock, label: "Opening hours", value: s.opening_hours },
    { icon: Phone, label: "Telephone", value: s.phone, href: s.phone ? telLink(s.phone) : undefined },
    { icon: Mail, label: "Email", value: s.email, href: s.email ? `mailto:${s.email}` : undefined },
  ].filter((i) => i.value);

  return (
    <SiteShell>
      <PageHeading eyebrow="Contact" title="We're a message away.">
        The fastest way to reach us is WhatsApp. You can also call or visit the showroom.
      </PageHeading>
      <div className="container-page grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <Reveal className="flex flex-col justify-between rounded-[2rem] bg-ink p-10 text-ink-foreground md:p-14">
          <div>
            <MessageCircle className="h-8 w-8 text-gold" />
            <h2 className="mt-6 text-3xl font-semibold md:text-4xl">Chat with our team on WhatsApp.</h2>
            <p className="mt-4 text-ink-foreground/70">Ask about any vehicle, prices or arrange an inspection.</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {s.whatsapp && (
              <Button asChild variant="whatsapp" size="xl">
                <a href={whatsappLink(s.whatsapp, generalEnquiryMessage())} target="_blank" rel="noreferrer">
                  <MessageCircle /> Open WhatsApp
                </a>
              </Button>
            )}
            {s.phone && (
              <Button asChild variant="glass" size="xl">
                <a href={telLink(s.phone)}>
                  <Phone /> Call us
                </a>
              </Button>
            )}
          </div>
        </Reveal>
        <div className="grid gap-4">
          {items.map((i, idx) => (
            <Reveal key={i.label} delay={idx * 70} className="flex items-start gap-4 rounded-3xl bg-surface p-6">
              <i.icon className="mt-0.5 h-5 w-5 text-gold" />
              <div>
                <p className="eyebrow">{i.label}</p>
                {i.href ? (
                  <a href={i.href} className="mt-1 block text-lg font-semibold hover:underline">
                    {i.value}
                  </a>
                ) : (
                  <p className="mt-1 text-lg font-semibold">{i.value}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      {s.address && (
        <div className="container-page mt-6">
          <Reveal className="overflow-hidden rounded-[2rem] border border-border">
            <iframe
              title="Map to the OP Motors showroom"
              src={`https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`}
              className="h-[380px] w-full grayscale"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>
        </div>
      )}
    </SiteShell>
  );
}
