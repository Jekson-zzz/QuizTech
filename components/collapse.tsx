"use client"

import { useEffect, useRef, useState } from "react"

interface CollapseProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export function Collapse({ isOpen, children, className }: CollapseProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [maxH, setMaxH] = useState<string>("0px")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isOpen) {
      // measure and set
      const h = el.scrollHeight
      setMaxH(h + "px")
      // after transition allow auto to avoid clipping on resize
      const t = setTimeout(() => setMaxH("none"), 300)
      return () => clearTimeout(t)
    } else {
      // from auto -> measured -> 0 to animate
      if (maxH === "none") {
        const h = el.scrollHeight
        // force a frame
        requestAnimationFrame(() => {
          setMaxH(h + "px")
          requestAnimationFrame(() => setMaxH("0px"))
        })
      } else {
        setMaxH("0px")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <div
      aria-hidden={!isOpen}
      className={className}
      style={{
        overflow: "hidden",
        transition: "max-height 300ms ease",
        maxHeight: maxH,
      }}
      ref={ref}
    >
      {children}
    </div>
  )
}
