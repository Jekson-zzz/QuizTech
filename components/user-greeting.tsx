"use client"

import { Flame, Trophy } from "lucide-react"

interface UserGreetingProps {
  userName?: string
  level?: number
  streak?: number
}

export function UserGreeting({ userName = "", level = 0, streak = 0 }: UserGreetingProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días"
    if (hour < 19) return "Buenas tardes"
    return "Buenas noches"
  }

  return (
    <div className="w-full bg-linear-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-border rounded-2xl p-6 mb-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-sm text-muted-foreground">Continúa tu aprendizaje y alcanza nuevas metas</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-xl px-4 py-2 border border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nivel</p>
              <p className="text-lg font-bold text-foreground">{level}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-xl px-4 py-2 border border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Flame className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Racha</p>
              <p className="text-lg font-bold text-foreground">{streak} días</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
