import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Number(value)))

  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className={cn("w-full bg-muted rounded-full overflow-hidden", className)} {...props}>
      <div className="h-full bg-linear-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
    </div>
  )
}

export { Progress }
