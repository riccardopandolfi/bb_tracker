import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-900 shadow-[0_12px_35px_rgba(45,212,191,0.45)] hover:brightness-110",
        destructive:
          "bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 text-white shadow-[0_12px_35px_rgba(248,113,113,0.4)] hover:brightness-110",
        outline:
          "border border-white/30 bg-transparent text-white shadow-[0_10px_30px_rgba(15,23,42,0.35)] hover:bg-white/10",
        secondary:
          "border border-white/10 bg-white/10 text-white shadow-[0_10px_30px_rgba(2,6,23,0.6)] hover:bg-white/20",
        ghost: "text-white/80 hover:text-white hover:bg-white/10",
        link: "text-emerald-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
