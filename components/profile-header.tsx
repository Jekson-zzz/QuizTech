"use client"

import { Trophy, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ProfileHeaderProps {
  name: string
  level: number
  currentXP: number
  xpToNextLevel: number
}

export function ProfileHeader({ name, level, currentXP, xpToNextLevel }: ProfileHeaderProps) {
  // Defensive guards: avoid division by zero or negative values causing
  // strange UI (e.g., -30950 XP). Clamp percentage between 0 and 100.
  const safeXpToNext = typeof xpToNextLevel === 'number' && xpToNextLevel > 0 ? xpToNextLevel : null
  let progressPercentage = 0
  if (safeXpToNext) {
    progressPercentage = (currentXP / safeXpToNext) * 100
    if (!isFinite(progressPercentage) || Number.isNaN(progressPercentage)) progressPercentage = 0
    if (progressPercentage < 0) progressPercentage = 0
    if (progressPercentage > 100) progressPercentage = 100
  }
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="relative overflow-hidden border-2 mb-6">
      <div className="absolute inset-0 bg-linear-gradient-to-br from-primary/10 via-accent/5 to-primary/5" />

      <div className="relative p-6">
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-3">{name.toLocaleUpperCase()}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">Nivel {level}</span>
              </div>
              <div className="flex items-center gap-1 bg-accent/10 rounded-full px-3 py-1">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-sm font-bold text-accent">XP {currentXP} </span>
                </div>
              {/* averageScore and studyTime are shown in the StatsGrid; avoid duplicating them here */}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso al Nivel {level + 1}</span>
            <span className="font-bold text-foreground">
              {currentXP} / {safeXpToNext ?? '—'} XP
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">
            {safeXpToNext ? Math.max(0, safeXpToNext - currentXP) + ' XP restantes' : '—'}
          </p>
        </div>
      </div>
    </Card>
  )
}
