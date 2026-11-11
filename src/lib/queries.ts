import { queryOptions } from "@tanstack/react-query";
import {
  getHomeData,
  getInventoryFacets,
  getSiteSettings,
  getVehicleBySlug,
  getVehiclesByIds,
  listInventory,
  listRecentlyAdded,
  type InventoryFilters,
} from "./public-data.functions";

export const settingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 5 * 60_000,
});

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
  staleTime: 30_000,
});

export const inventoryQuery = (filters: InventoryFilters) =>
  queryOptions({
    queryKey: ["inventory", filters],
    queryFn: () => listInventory({ data: filters }),
    staleTime: 30_000,
  });

export const facetsQuery = queryOptions({
  queryKey: ["inventory-facets"],
  queryFn: () => getInventoryFacets(),
  staleTime: 60_000,
});

export const vehicleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["vehicle", slug],
    queryFn: () => getVehicleBySlug({ data: { slug } }),
    staleTime: 30_000,
  });

export const favouritesQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["favourites", ids],
    queryFn: () => getVehiclesByIds({ data: { ids } }),
  });

export const recentQuery = queryOptions({
  queryKey: ["recent"],
  queryFn: () => listRecentlyAdded(),
  staleTime: 30_000,
});
