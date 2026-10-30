"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isPlatformNavChildActive,
  isPlatformNavGroup,
  isPlatformNavGroupActive,
  isPlatformNavLinkActive,
  type PlatformNavGroup,
  type PlatformNavItem,
  type PlatformNavLink,
} from "@/lib/platform/platform-nav";
import {
  mobileNavChildLinkClass,
  mobileNavLinkClass,
  mobileNavToggleClass,
  sidebarNavChildLinkClass,
  sidebarNavLinkClass,
  sidebarNavToggleClass,
} from "@/lib/platform/nav-styles";

type PlatformNavProps = {
  items: PlatformNavItem[];
  viewAllLabel: string;
  variant: "sidebar" | "mobile";
};

function NavLink({
  item,
  variant,
}: {
  item: PlatformNavLink;
  variant: PlatformNavProps["variant"];
}) {
  const pathname = usePathname();
  const active = isPlatformNavLinkActive(item, pathname);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={
        variant === "mobile"
          ? mobileNavLinkClass(active)
          : sidebarNavLinkClass(active)
      }
    >
      {item.label}
    </Link>
  );
}

function NavGroup({
  item,
  viewAllLabel,
  variant,
}: {
  item: PlatformNavGroup;
  viewAllLabel: string;
  variant: PlatformNavProps["variant"];
}) {
  const pathname = usePathname();
  const active = isPlatformNavGroupActive(item, pathname);
  const [open, setOpen] = useState(active);
  const [prevActive, setPrevActive] = useState(active);

  if (active !== prevActive) {
    setPrevActive(active);
    if (active) {
      setOpen(true);
    }
  }

  if (item.children.length === 0) {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={
          variant === "mobile"
            ? mobileNavLinkClass(active)
            : sidebarNavLinkClass(active)
        }
      >
        {item.label}
      </Link>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={mobileNavToggleClass(active)}
        >
          <span>{item.label}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open ? (
          <div className="mt-2 flex flex-col gap-0.5 border-l border-border pl-3">
            <Link
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={mobileNavChildLinkClass(pathname === item.href)}
            >
              {viewAllLabel}
            </Link>
            {item.children.map((child) => {
              const childActive = isPlatformNavChildActive(child.href, pathname);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  aria-current={childActive ? "page" : undefined}
                  className={mobileNavChildLinkClass(childActive)}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={sidebarNavToggleClass(active)}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="mt-0.5 ml-2 flex flex-col gap-0.5 border-l border-border pl-2">
          <Link
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={sidebarNavChildLinkClass(pathname === item.href)}
          >
            {viewAllLabel}
          </Link>
          {item.children.map((child) => {
            const childActive = isPlatformNavChildActive(child.href, pathname);
            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={childActive ? "page" : undefined}
                className={sidebarNavChildLinkClass(childActive)}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function PlatformNav({ items, viewAllLabel, variant }: PlatformNavProps) {
  const containerClass =
    variant === "mobile"
      ? "flex flex-col gap-2"
      : "flex flex-col gap-1";

  return (
    <nav className={containerClass}>
      {items.map((item) =>
        isPlatformNavGroup(item) ? (
          <NavGroup
            key={item.href}
            item={item}
            viewAllLabel={viewAllLabel}
            variant={variant}
          />
        ) : (
          <NavLink key={item.href} item={item} variant={variant} />
        ),
      )}
    </nav>
  );
}
