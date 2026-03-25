import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-primary hover:bg-primary-hover hover:border-primary-hover uppercase tracking-[0.06em] text-xs",
        outline:
          "bg-transparent text-foreground border-2 border-foreground hover:bg-foreground hover:text-background uppercase tracking-[0.06em] text-xs",
        "outline-inverse":
          "bg-transparent text-white border-2 border-white hover:bg-white hover:text-black uppercase tracking-[0.06em] text-xs",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:border-foreground hover:bg-secondary uppercase tracking-[0.06em] text-xs",
        ghost:
          "bg-transparent border-transparent text-foreground hover:bg-transparent hover:underline underline-offset-4 text-xs",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link:
          "text-foreground underline underline-offset-4 hover:opacity-70",
      },
      size: {
        default: "h-10 px-7 py-2.5 text-xs",
        sm: "h-8 px-5 py-1.5 text-xs",
        lg: "h-12 px-9 py-3 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
