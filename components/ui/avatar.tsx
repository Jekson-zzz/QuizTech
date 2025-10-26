import * as React from "react"
import { cn } from "@/lib/utils"

function Avatar({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="avatar" className={cn("inline-flex items-center justify-center rounded-full overflow-hidden", className)} {...props}>
      {children}
    </div>
  )
}

function AvatarFallback({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="avatar-fallback" className={cn("flex items-center justify-center w-full h-full", className)} {...props}>
      {children}
    </div>
  )
}

export { Avatar, AvatarFallback }
