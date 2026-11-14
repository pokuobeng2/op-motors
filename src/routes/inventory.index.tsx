import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteShell, PageHeading } from "@/components/site/SiteShell";
import { VehicleGrid } from "@/components/site/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { facetsQuery, inventoryQuery } from "@/lib/queries";
import { SORT_OPTIONS, type SortOption } from "@/lib/vehicle-options";
import { formatPrice } from "@/lib/format";
import type { InventoryFilters } from "@/lib/public-data.functions";
import { buildMetaTags, DEFAULT_OG_IMAGE } from "@/lib/seo";

type InventorySearch = {
  q?: string | undefined;
  make?: string | undefined;
  model?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minYear?: number | undefined;
  maxYear?: number | undefined;
  fuel?: string | undefined;
  transmission?: string | undefined;
  body?: string | undefined;
  condition?: string | undefined;
  sort?: SortOption | undefined;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : undefined);
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export const Route = createFileRoute("/inventory/")({
  validateSearch: (s: Record<string, unknown>): InventorySearch => ({
    q: str(s["q"]),
    make: str(s["make"]),
    model: str(s["model"]),
    minPrice: num(s["minPrice"]),
    maxPrice: num(s["maxPrice"]),
    minYear: num(s["minYear"]),
    maxYear: num(s["maxYear"]),
    fuel: str(s["fuel"]),
    transmission: str(s["transmission"]),
    body: str(s["body"]),
    condition: str(s["condition"]),
    sort: SORT_OPTIONS.some((o) => o.value === s["sort"]) ? (s["sort"] as SortOption) : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(inventoryQuery(clean(deps))),
      context.queryClient.ensureQueryData(facetsQuery),
    ]),
  head: () => ({
    meta: buildMetaTags({
      title: "Vehicle inventory — OP Motors",
      description:
        "Search and filter every available vehicle at OP Motors by make, model, price, year, fuel type and more.",
      image: DEFAULT_OG_IMAGE,
      imageAlt: "Browse our inventory of premium vehicles at OP Motors",
      url: "/inventory",
    }),
  }),
  component: InventoryPage,
  errorComponent: ({ error }) => (
    <div className="container-page py-24 text-center text-muted-foreground" role="alert">
      We couldn't load the inventory. {error instanceof Error ? error.message : ""}
    </div>
  ),
});

function clean(s: InventorySearch): InventoryFilters {
  return Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) as InventoryFilters;
}

export const PRICE_STEPS = [
  50000,
  100000,
  150000,
  200000,
  250000,
  300000,
  350000,
  400000,
  450000,
  500000,
  550000,
  600000,
  650000,
  700000,
  750000,
  800000,
  850000,
  900000,
  950000,
  1000000,
  1250000,
  1500000,
  1750000,
  2000000,
  2500000,
  3000000,
  4000000,
  5000000,
];

function InventoryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/inventory/" });
  const filters = clean(search);
  const { data: facets } = useSuspenseQuery(facetsQuery);
  const { data: vehicles = [], isFetching } = useQuery({ ...inventoryQuery(filters), placeholderData: (p) => p });
  const [q, setQ] = useState(search.q ?? "");

  useEffect(() => setQ(search.q ?? ""), [search.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== q.trim()) navigate({ search: (p) => ({ ...p, q: q.trim() || undefined }), replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [q, search.q, navigate]);

  const set = (patch: Partial<InventorySearch>) =>
    navigate({ search: (p) => ({ ...p, ...patch }), replace: true, resetScroll: false });

  const activeCount = Object.entries(filters).filter(([k]) => k !== "sort" && k !== "q").length;

  const currentYear = new Date().getFullYear();
  const minYear = facets.minYear ?? currentYear - 5;
  const maxYear = facets.maxYear ?? currentYear;
  const yearOptions =
    maxYear >= minYear
      ? Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i))
      : [String(currentYear)];

  const filterControls = (
    <div className="grid gap-5">
      <FacetSelect label="Make" value={search.make} options={facets.makes} onChange={(v) => set({ make: v, model: undefined })} />
      <FacetSelect
        label="Model"
        value={search.model}
        options={search.make ? (facets.modelsByMake[search.make] ?? []) : Object.values(facets.modelsByMake).flat().sort()}
        onChange={(v) => set({ model: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <FacetSelect
          label="Min price"
          value={search.minPrice?.toString()}
          options={PRICE_STEPS.map(String)}
          format={(v) => formatPrice(Number(v))}
          onChange={(v) => set({ minPrice: v ? Number(v) : undefined })}
          anyLabel="No min"
        />
        <FacetSelect
          label="Max price"
          value={search.maxPrice?.toString()}
          options={PRICE_STEPS.map(String)}
          format={(v) => formatPrice(Number(v))}
          onChange={(v) => set({ maxPrice: v ? Number(v) : undefined })}
          anyLabel="No max"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["minYear", "maxYear"] as const).map((k) => (
          <FacetSelect
            key={k}
            label={k === "minYear" ? "From year" : "To year"}
            value={search[k]?.toString()}
            options={yearOptions}
            onChange={(v) => set({ [k]: v ? Number(v) : undefined })}
          />
        ))}
      </div>
      <FacetSelect label="Body type" value={search.body} options={facets.bodies} onChange={(v) => set({ body: v })} />
      <FacetSelect label="Fuel type" value={search.fuel} options={facets.fuels} onChange={(v) => set({ fuel: v })} />
      <FacetSelect label="Transmission" value={search.transmission} options={facets.transmissions} onChange={(v) => set({ transmission: v })} />
      <FacetSelect label="Condition" value={search.condition} options={facets.conditions} onChange={(v) => set({ condition: v })} />
      {activeCount > 0 && (
        <Button variant="outline" onClick={() => navigate({ search: { q: search.q, sort: search.sort }, replace: true })}>
          <X /> Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <SiteShell>
      <div className="hidden md:block">
        <PageHeading eyebrow="Inventory" title="Find your next car.">
          Every vehicle below is available now.
        </PageHeading>
      </div>
      <div className="container-page pt-3 md:pt-0">
        <div className="sticky top-16 z-30 -mx-5 flex flex-col md:flex-row md:items-center gap-2.5 md:gap-3 bg-background/95 px-5 py-3 md:py-4 backdrop-blur md:mx-0 md:px-0">
          <div className="relative w-full md:min-w-0 md:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search make, model, year or stock ID"
              aria-label="Search vehicles"
              className="h-12 w-full rounded-full border-border bg-surface pl-11 text-base shadow-none"
            />
          </div>
          <div className="flex w-full items-center gap-2.5 md:w-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="flex-1 md:flex-initial h-11 md:h-12 rounded-full lg:hidden text-sm gap-1.5 px-4">
                  <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount > 0 && ` (${activeCount})`}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
                <SheetTitle className="mb-6 font-display text-2xl">Filters</SheetTitle>
                {filterControls}
              </SheetContent>
            </Sheet>
            <Select value={search.sort ?? "recent"} onValueChange={(v) => set({ sort: v === "recent" ? undefined : (v as SortOption) })}>
              <SelectTrigger className="flex-1 md:flex-initial h-11 md:h-12 md:w-[200px] rounded-full text-sm" aria-label="Sort vehicles">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-40">{filterControls}</div>
          </aside>
          <div>
            <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
              {isFetching ? "Updating…" : `${vehicles.length} ${vehicles.length === 1 ? "vehicle" : "vehicles"} found`}
            </p>
            {vehicles.length > 0 ? (
              <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                <VehicleGrid vehicles={vehicles} />
              </div>
            ) : (
              <div className="rounded-3xl bg-surface px-6 py-20 text-center">
                <h2 className="text-2xl font-semibold">No vehicles match.</h2>
                <p className="mt-2 text-muted-foreground">Try removing a filter, or ask us — new stock arrives often.</p>
                <Button asChild variant="outline" className="mt-6">
                  <Link to="/inventory" search={{}}>
                    Reset search
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function FacetSelect({
  label,
  value,
  options,
  onChange,
  format,
  anyLabel = "Any",
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (v: string | undefined) => void;
  format?: (v: string) => string;
  anyLabel?: string | undefined;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      <Select value={value ?? "__any"} onValueChange={(v) => onChange(v === "__any" ? undefined : v)}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__any">{anyLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {format ? format(o) : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
