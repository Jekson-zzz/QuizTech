import * as React from "react"

import { cn } from "@/lib/utils"

const inputBase =
  "flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = "text", ...props },
  ref
) {
  return <input ref={ref} type={type} className={cn(inputBase, className)} {...props} />
})

Input.displayName = "Input"

export { Input }
