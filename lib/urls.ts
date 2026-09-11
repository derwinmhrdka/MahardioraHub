export type FilterParams = {
  area?: string | null;
  category?: string | null;
  platform?: string | null;
  /** Collection only — filter to active pre-order products. */
  preOrder?: boolean | null;
};

export function withFilters(path: string, params: FilterParams = {}): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.area) search.set("area", params.area);
  if (params.platform) search.set("platform", params.platform);
  if (params.preOrder) search.set("preorder", "1");
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export function parsePreOrderParam(raw: string | undefined): boolean {
  return raw === "1" || raw === "true" || raw === "yes";
}
