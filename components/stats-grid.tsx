"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, Target, Flame } from "lucide-react"

interface StatsGridProps {
  stats: {
    quizzesCompleted: number
    averageScore: number
    streak: number
  }
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statsData = [
    {
      icon: CheckCircle2,
      label: "Quizzes Completados",
      value: stats.quizzesCompleted,
      color: "from-primary to-primary/70",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      label: "Puntuación Promedio",
      value: `${stats.averageScore}%`,
      color: "from-accent to-accent/70",
      bgColor: "bg-accent/10",
    },
    {
      icon: Flame,
      label: "Racha de Días",
      value: `${stats.streak} días`,
      color: "from-chart-3 to-chart-3/70",
      bgColor: "bg-chart-3/10",
    },
  ]

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Estadísticas</h2>
      <div className="grid grid-cols-2 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="p-4 border-2 transition-all hover:border-primary hover:shadow-lg">
              <div className="flex flex-col gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}