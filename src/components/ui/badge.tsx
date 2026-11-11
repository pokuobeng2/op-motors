import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        gold: "border-transparent bg-gold text-gold-foreground",
        glass: "glass border-border text-foreground",
        available: "border-transparent bg-success/12 text-success",
        reserved: "border-transparent bg-warning/20 text-warning-foreground",
        sold: "border-transparent bg-ink text-ink-foreground",
        draft: "border-transparent bg-surface-strong text-muted-foreground",
        withdrawn: "border-transparent bg-destructive/10 text-destructive",
        archived: "border-dashed border-border bg-background text-muted-foreground",
        info: "border-transparent bg-info/12 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
