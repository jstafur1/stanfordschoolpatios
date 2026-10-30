export type PlatformNavChild = {
  href: string;
  label: string;
};

export type PlatformNavLink = {
  type: "link";
  href: string;
  label: string;
  /** When true, only the exact path is considered active. */
  exact?: boolean;
};

export type PlatformNavGroup = {
  type: "group";
  /** "View all" destination and list hub. */
  href: string;
  label: string;
  /** Path prefix that marks this group active (e.g. `/student/courses`). */
  matchPrefix: string;
  children: PlatformNavChild[];
};

export type PlatformNavItem = PlatformNavLink | PlatformNavGroup;

export function isPlatformNavGroup(
  item: PlatformNavItem,
): item is PlatformNavGroup {
  return item.type === "group";
}

export function isPlatformNavLinkActive(
  item: PlatformNavLink,
  pathname: string,
): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function isPlatformNavGroupActive(
  item: PlatformNavGroup,
  pathname: string,
): boolean {
  if (pathname === item.href) return true;
  if (
    pathname === item.matchPrefix ||
    pathname.startsWith(`${item.matchPrefix}/`)
  ) {
    return true;
  }
  return item.children.some(
    (child) =>
      pathname === child.href || pathname.startsWith(`${child.href}/`),
  );
}

export function isPlatformNavChildActive(
  href: string,
  pathname: string,
): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
