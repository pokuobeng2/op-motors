import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Clock, Phone, MessageCircle, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { settingsQuery } from "@/lib/queries";
import { telLink, whatsappLink, generalEnquiryMessage } from "@/lib/contact";

export function SiteFooter() {
  const { data: s } = useSuspenseQuery(settingsQuery);

  return (
    <footer className="mt-28 border-t border-border/40 bg-surface/30">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand & Introduction */}
          <div className="space-y-4 lg:col-span-4">
            <Logo showTagline />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {s.tagline || "Curated luxury and performance automobiles, inspected and presented with integrity."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Explore
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/inventory" className="text-muted-foreground transition-colors hover:text-foreground">
                  All Vehicles
                </Link>
              </li>
              <li>
                <Link to="/recent" className="text-muted-foreground transition-colors hover:text-foreground">
                  Recent Arrivals
                </Link>
              </li>
              <li>
                <Link to="/favourites" className="text-muted-foreground transition-colors hover:text-foreground">
                  Saved Favourites
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                  About OP Motors
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Visit Showroom */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Visit Showroom
            </p>
            <div className="space-y-3 text-sm">
              {s.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-snug">{s.address}</span>
                </div>
              )}
              {s.opening_hours && (
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-snug">{s.opening_hours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Direct Contact */}
          <div className="space-y-3 lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Contact
            </p>
            <div className="space-y-3 text-sm">
              {s.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-foreground shrink-0" />
                  <a
                    href={telLink(s.phone)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.phone}
                  </a>
                </div>
              )}
              {s.whatsapp && (
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 text-foreground shrink-0" />
                  <a
                    href={whatsappLink(s.whatsapp, generalEnquiryMessage())}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    WhatsApp Chat
                  </a>
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-foreground shrink-0" />
                  <a
                    href={`mailto:${s.email}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
