import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  href: React.ComponentProps<typeof Link>["href"];
  children: React.ReactNode;
  className?: string;
};

export function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
      <span className="truncate">{children}</span>
    </Link>
  );
}
