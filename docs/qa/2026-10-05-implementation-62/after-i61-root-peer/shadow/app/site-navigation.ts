export type AtlasRoute = Readonly<{
  href: string;
  label: string;
  section: string;
  parentHref?: string;
}>;

export type AtlasNavigationItem = Readonly<{
  href: string;
  label: string;
  secondary?: boolean;
  children?: readonly AtlasNavigationItem[];
}>;

export type AtlasNavigationGroup = Readonly<{
  id: string;
  label: string;
  items: readonly AtlasNavigationItem[];
}>;

export type AtlasBreadcrumb = Readonly<{ label: string; href?: string }>;

export const ATLAS_ROUTES: readonly AtlasRoute[] = [
  { href: "/", label: "Overview", section: "Overview" },
  { href: "/explore/morphology", label: "Morphology", section: "Explore" },
  { href: "/explore/morphology/viewer", label: "Single-cell viewer", section: "Explore", parentHref: "/explore/morphology" },
  { href: "/explore/cell-types", label: "Cell types", section: "Explore" },
  { href: "/explore/cell-types/zebrafish", label: "Zebrafish references", section: "Explore", parentHref: "/explore/cell-types" },
  { href: "/explore/cell-types/additional", label: "Additional evidence", section: "Explore", parentHref: "/explore/cell-types" },
  { href: "/explore/cell-types/compare", label: "Compare sources", section: "Explore", parentHref: "/explore/cell-types" },
  { href: "/explore/anatomy", label: "Anatomy", section: "Explore" },
  { href: "/explore/positions", label: "Positions", section: "Explore" },
  { href: "/research/explorer", label: "Research explorer", section: "Research" },
  { href: "/research/overview", label: "Evidence map", section: "Research" },
  { href: "/research/sci", label: "SCI conditions", section: "Research" },
  { href: "/research/coverage", label: "Evidence coverage", section: "Research" },
  { href: "/sources", label: "Source registry", section: "Sources" },
  { href: "/objects", label: "Source objects", section: "Sources" },
  { href: "/source-audits", label: "Source audits", section: "Sources" },
  { href: "/catalogues/svara", label: "Svara catalogue", section: "Sources", parentHref: "/sources" },
  { href: "/connectivity/svara", label: "Svara connectivity", section: "Sources", parentHref: "/catalogues/svara" },
  { href: "/workspace", label: "3D workspace", section: "Workspace" },
];

export const NAV_GROUPS: readonly AtlasNavigationGroup[] = [
  { id: "overview", label: "Start", items: [{ href: "/", label: "Overview" }, { href: "/workspace", label: "3D workspace" }] },
  {
    id: "explore", label: "Explore", items: [
      { href: "/explore/morphology", label: "Morphology", children: [
        { href: "/explore/morphology/viewer", label: "Single-cell viewer" },
      ] },
      { href: "/explore/cell-types", label: "Cell types", children: [
        { href: "/explore/cell-types/zebrafish", label: "Zebrafish references" },
        { href: "/explore/cell-types/additional", label: "Additional evidence" },
        { href: "/explore/cell-types/compare", label: "Compare sources" },
      ] },
      { href: "/explore/anatomy", label: "Anatomy" },
      { href: "/explore/positions", label: "Positions" },
    ],
  },
  {
    id: "research", label: "Research", items: [
      { href: "/research/explorer", label: "Research explorer" },
      { href: "/research/overview", label: "Evidence map" },
      { href: "/research/sci", label: "SCI conditions" },
      { href: "/research/coverage", label: "Evidence coverage" },
    ],
  },
  {
    id: "sources", label: "Sources", items: [
      { href: "/sources", label: "Source registry" },
      { href: "/objects", label: "Source objects" },
      { href: "/source-audits", label: "Source audits" },
      { href: "/catalogues/svara", label: "Svara catalogue", secondary: true },
      { href: "/connectivity/svara", label: "Svara connectivity", secondary: true },
    ],
  },
];

export function normalizeAtlasPath(pathname: string | null | undefined): string {
  const path = (pathname ?? "/").split(/[?#]/, 1)[0];
  return path === "/" ? path : path.replace(/\/+$/, "") || "/";
}

export function getAtlasRoute(pathname: string | null | undefined): AtlasRoute | null {
  const path = normalizeAtlasPath(pathname);
  return ATLAS_ROUTES.find((route) => route.href === path) ?? null;
}

export function getAtlasBreadcrumbs(pathname: string | null | undefined): readonly AtlasBreadcrumb[] {
  const route = getAtlasRoute(pathname);
  if (!route || route.href === "/") return [{ label: "Overview", ...(route ? {} : { href: "/" }) }];

  const parents: AtlasBreadcrumb[] = [];
  let parent = getAtlasRoute(route.parentHref);
  while (parent && parent.href !== "/") {
    parents.unshift({ label: parent.label, href: parent.href });
    parent = parent.parentHref ? getAtlasRoute(parent.parentHref) : null;
  }
  return [
    { label: "Overview", href: "/" },
    { label: route.section },
    ...parents,
    { label: route.label },
  ];
}
