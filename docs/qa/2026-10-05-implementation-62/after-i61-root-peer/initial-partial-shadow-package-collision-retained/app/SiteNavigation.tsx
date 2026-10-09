"use client";

import Link from "next/link";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getAtlasBreadcrumbs, NAV_GROUPS, normalizeAtlasPath, type AtlasNavigationItem } from "./site-navigation";
import "./site-navigation.css";

function NavigationItems({ items, pathname, nested = false }: {
  items: readonly AtlasNavigationItem[];
  pathname: string;
  nested?: boolean;
}) {
  return (
    <ul className={nested ? "site-nav-children" : "site-nav-items"}>
      {items.map((item) => {
        const current = pathname === item.href;
        const branchActive = current || Boolean(item.children?.some((child) => pathname === child.href));
        return (
          <li key={item.href} className={item.secondary ? "site-nav-secondary" : undefined}>
            <a href={item.href} aria-current={current ? "page" : undefined}
              className={branchActive && !current ? "site-nav-parent-active" : undefined}>
              <span>{item.label}</span>
              {current && <span className="site-nav-current-mark" aria-hidden="true" />}
            </a>
            {branchActive && item.children && <NavigationItems items={item.children} pathname={pathname} nested />}
          </li>
        );
      })}
    </ul>
  );
}

function NavigationGroups({ pathname, location }: { pathname: string; location: "desktop" | "mobile" }) {
  return (
    <nav className="site-primary-nav" aria-label="Atlas pages">
      {NAV_GROUPS.map((group) => (
        <section className={`site-nav-group site-nav-group-${group.id}`} key={group.id}
          aria-labelledby={`site-nav-${location}-${group.id}`}>
          <h2 id={`site-nav-${location}-${group.id}`}>{group.label}</h2>
          <NavigationItems items={group.items} pathname={pathname} />
        </section>
      ))}
    </nav>
  );
}

function AtlasBrand() {
  return (
    <Link className="site-brand" href="/" aria-label="Interneuron Atlas overview">
      <span className="site-brand-name">Interneuron<br /> Atlas</span>
      <span className="site-brand-scope">Mouse spinal cord</span>
    </Link>
  );
}

export default function SiteNavigation({ children }: { children: ReactNode }) {
  const pathname = normalizeAtlasPath(usePathname());
  const breadcrumbs = getAtlasBreadcrumbs(pathname);

  return (
    <div className="site-frame">
      <aside className="site-sidebar" aria-label="Atlas navigation">
        <AtlasBrand />
        <NavigationGroups pathname={pathname} location="desktop" />
        <p className="site-sidebar-note">Public-data research<br /><span>Source identities remain distinct.</span></p>
      </aside>

      <div className="site-page-column">
        <header className="site-mobile-header">
          <AtlasBrand />
          <details className="site-mobile-menu">
            <summary>Browse atlas <span aria-hidden="true">⌄</span></summary>
            <NavigationGroups pathname={pathname} location="mobile" />
          </details>
        </header>

        <nav className="site-breadcrumbs" aria-label="Breadcrumb">
          <ol>{breadcrumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`}>
              {crumb.href ? <a href={crumb.href}>{crumb.label}</a>
                : <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{crumb.label}</span>}
            </li>
          ))}</ol>
        </nav>

        <div className="site-page-content" id="atlas-page-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  );
}
