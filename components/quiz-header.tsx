"use client"

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizHeaderProps {
  categoryTitle: string
  timeLeft: number
  color: string
}

export function QuizHeader({ categoryTitle, timeLeft, color }: QuizHeaderProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isLowTime = timeLeft < 60

  return (
    <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-1 rounded-full bg-linear-to-b", color)} />
          <h1 className="text-xl font-bold text-card-foreground md:text-2xl">{categoryTitle}</h1>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 font-mono text-lg font-bold transition-colors",
            isLowTime ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-muted-foreground",
          )}
        >
          <Clock className={cn("h-5 w-5", isLowTime && "animate-bounce")} />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  )
}