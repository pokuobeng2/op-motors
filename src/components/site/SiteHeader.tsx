import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Menu, MessageCircle, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { settingsQuery } from "@/lib/queries";
import { generalEnquiryMessage, telLink, whatsappLink } from "@/lib/contact";
import { useFavourites } from "@/lib/favourites";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inventory", label: "Inventory" },
  { to: "/recent", label: "Recently Added" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { ids } = useFavourites();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled ? "glass border-b border-border/70" : "bg-background",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/favourites"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface"
            aria-label={`Favourites (${ids.length})`}
          >
            <Heart className="h-[18px] w-[18px]" />
            {ids.length > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {ids.length}
              </span>
            )}
          </Link>
          {settings.whatsapp && (
            <Button asChild variant="whatsapp" size="sm" className="hidden sm:inline-flex">
              <a href={whatsappLink(settings.whatsapp, generalEnquiryMessage())} target="_blank" rel="noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-1">
                {[{ to: "/", label: "Home" } as const, ...NAV, { to: "/favourites", label: "Favourites" } as const].map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 font-display text-2xl font-semibold tracking-tight transition-colors hover:bg-surface"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 grid gap-3 px-4">
                {settings.whatsapp && (
                  <Button asChild variant="whatsapp" size="lg">
                    <a href={whatsappLink(settings.whatsapp, generalEnquiryMessage())} target="_blank" rel="noreferrer">
                      <MessageCircle /> Chat on WhatsApp
                    </a>
                  </Button>
                )}
                {settings.phone && (
                  <Button asChild variant="outline" size="lg">
                    <a href={telLink(settings.phone)}>
                      <Phone /> {settings.phone}
                    </a>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
