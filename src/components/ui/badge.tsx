import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius)] border px-2.5 py-0.5 text-xs font-medium tracking-[0.06em] uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-foreground text-background",
        secondary:
          "border-border bg-secondary text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "border-foreground bg-transparent text-foreground",
        published:
          "bg-[#f0f7f4] text-[#2d6a4f] border-[#c3ddd6]",
        draft:
          "bg-[#f7f7f5] text-[#5c5c3a] border-[#d4d4b8]",
        archived:
          "bg-[#faf5f5] text-[#7a3535] border-[#ddbcbc]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
