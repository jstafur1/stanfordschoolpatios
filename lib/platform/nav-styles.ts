import { cn } from "@/lib/utils";

/** Keyboard-only focus ring for controls on sidebar/card surfaces. */
export const navFocusOnCardClass =
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card";

/** Keyboard-only focus ring for controls on the main page background. */
export const navFocusOnBackgroundClass =
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function sidebarNavLinkClass(active: boolean) {
  return cn(
    "rounded-lg px-3 py-2 text-sm transition-colors",
    navFocusOnCardClass,
    active
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function sidebarNavChildLinkClass(active: boolean) {
  return cn(
    "block rounded-md px-3 py-1.5 text-sm transition-colors",
    navFocusOnCardClass,
    active
      ? "bg-muted/80 font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function sidebarNavToggleClass(active: boolean) {
  return cn(
    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
    navFocusOnCardClass,
    active
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function mobileNavLinkClass(active: boolean) {
  return cn(
    "rounded-full border px-3 py-1.5 text-sm transition-colors",
    navFocusOnBackgroundClass,
    active
      ? "border-primary/40 bg-primary/10 text-foreground"
      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function mobileNavToggleClass(active: boolean) {
  return cn(
    "flex w-full items-center justify-between rounded-full border px-3 py-1.5 text-left text-sm transition-colors",
    navFocusOnBackgroundClass,
    active
      ? "border-primary/40 bg-primary/10 text-foreground"
      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function pillNavLinkClass(active: boolean) {
  return cn(
    "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
    navFocusOnBackgroundClass,
    active
      ? "border-primary/40 bg-primary/10 text-foreground"
      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function courseSidebarNavLinkClass(active: boolean) {
  return cn(
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
    navFocusOnBackgroundClass,
    active
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function mobileNavChildLinkClass(active: boolean) {
  return cn(
    "block rounded-md px-3 py-1.5 text-sm transition-colors",
    navFocusOnBackgroundClass,
    active
      ? "bg-muted/80 font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  );
}

export function localeToggleButtonClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
    navFocusOnCardClass,
    active
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}
