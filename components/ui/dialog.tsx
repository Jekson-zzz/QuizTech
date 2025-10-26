"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open?: boolean) => void
  children?: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const onClose = React.useCallback(() => onOpenChange?.(false), [onOpenChange])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }

    if (open) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  React.useEffect(() => {
    function onDialogClose() {
      onClose()
    }

    document.addEventListener("dialog-close", onDialogClose as EventListener)
    return () => document.removeEventListener("dialog-close", onDialogClose as EventListener)
  }, [onClose])

  if (!open) return null

  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl px-4">
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    </div>
  )

  return typeof document !== "undefined" ? createPortal(node, document.body) : null
}

function DialogContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn("relative bg-background rounded-lg shadow-lg w-full p-6", className)}
      {...props}
    >
      <button
        type="button"
        aria-label="Cerrar diálogo"
        title="Cerrar"
        onClick={() => {
          // allow parent Dialog to handle close via onOpenChange if provided
          const ev = new CustomEvent("dialog-close", { bubbles: true })
          // dispatch from document so listeners don't depend on target
          document.dispatchEvent(ev)
        }}
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        style={{ background: "transparent", border: 0 }}
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  )
}

function DialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  )
}

function DialogTitle({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none", className)} {...props}>
      {children}
    </h2>
  )
}

function DialogDescription({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }
