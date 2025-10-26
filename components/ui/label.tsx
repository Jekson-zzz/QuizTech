import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-sm font-medium leading-none text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Label }
