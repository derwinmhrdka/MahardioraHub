export type FilterParams = {
  area?: string | null;
  category?: string | null;
  platform?: string | null;
};

export function withFilters(path: string, params: FilterParams = {}): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.area) search.set("area", params.area);
  if (params.platform) search.set("platform", params.platform);
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/** @deprecated use withFilters */
export function withAreaQuery(
  path: string,
  area?: string | null,
  category?: string | null
): string {
  return withFilters(path, { area, category });
}
