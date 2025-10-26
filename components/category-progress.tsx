"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database, Code2, Network, Cpu } from "lucide-react"

export function CategoryProgress() {
  const categories = [
    {
      id: "1",
      title: "Bases de Datos",
      icon: Database,
      color: "from-primary to-primary/70",
      bgColor: "bg-primary/10",
      completed: 8,
      total: 15,
      averageScore: 92,
    },
    {
      id: "2",
      title: "Programación",
      icon: Code2,
      color: "from-accent to-accent/70",
      bgColor: "bg-accent/10",
      completed: 12,
      total: 20,
      averageScore: 85,
    },
    {
      id: "3",
      title: "Redes",
      icon: Network,
      color: "from-chart-3 to-chart-3/70",
      bgColor: "bg-chart-3/10",
      completed: 15,
      total: 18,
      averageScore: 88,
    },
    {
      id: "4",
      title: "Arquitectura",
      icon: Cpu,
      color: "from-chart-4 to-chart-4/70",
      bgColor: "bg-chart-4/10",
      completed: 12,
      total: 17,
      averageScore: 79,
    },
  ]

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Progreso por Categoría</h2>
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon
          const progressPercentage = (category.completed / category.total) * 100

          return (
            <Card key={category.id} className="p-5 border-2 transition-all hover:border-primary hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.bgColor} shrink-0`}>
                  <Icon className="h-6 w-6" style={{ color: `oklch(var(--color-${category.color.split("-")[1]}))` }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground">{category.title}</h3>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {category.completed}/{category.total}
                    </span>
                  </div>

                  <Progress value={progressPercentage} className="h-2 mb-3" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Puntuación promedio</span>
                    <span className="font-bold text-foreground">{category.averageScore}%</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
