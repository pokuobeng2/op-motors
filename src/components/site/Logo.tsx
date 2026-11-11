import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { OpLogoIcon } from "./OpLogoIcon";

interface LogoProps {
  className?: string;
  iconSize?: number;
  showTagline?: boolean;
}

export function Logo({ className, iconSize = 34, showTagline = false }: LogoProps) {
  return (
    <Link
      to="/"
      className={cn("group inline-flex items-center gap-2.5 transition-opacity hover:opacity-95", className)}
      aria-label="OP Motors home"
    >
      <OpLogoIcon size={iconSize} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-display text-xl font-bold tracking-[0.14em] text-foreground">
            OP
          </span>
          <span className="h-3 w-[1.5px] rounded-full bg-gold" />
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.26em] text-muted-foreground group-hover:text-foreground transition-colors">
            Motors
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Premium Showroom
          </span>
        )}
      </div>
    </Link>
  );
}
