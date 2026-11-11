import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function PageHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="container-page pb-10 pt-14 md:pt-20">
      {eyebrow && <p className="eyebrow animate-fade-up">{eyebrow}</p>}
      <h1 className="mt-3 max-w-3xl animate-fade-up text-4xl font-semibold md:text-6xl" style={{ animationDelay: "80ms" }}>
        {title}
      </h1>
      {children && (
        <div className="mt-5 max-w-2xl animate-fade-up text-lg text-muted-foreground" style={{ animationDelay: "160ms" }}>
          {children}
        </div>
      )}
    </div>
  );
}
