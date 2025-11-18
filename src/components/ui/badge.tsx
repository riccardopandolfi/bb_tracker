import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/50",
  {
    variants: {
      variant: {
        default:
          "border-white/20 bg-white/10 text-white",
        secondary:
          "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
        destructive:
          "border-rose-400/40 bg-rose-500/20 text-rose-100",
        outline: "border-white/40 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
