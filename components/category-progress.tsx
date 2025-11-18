"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database, Code2, Network, Cpu } from "lucide-react"

type CategoryStat = {
  id: number | string
  name: string
  total_questions: number
  correct_answers: number
  answered_questions: number
  avg_score: number | null
  total_attempts: number | null
}

const ICONS = [Database, Code2, Network, Cpu]
const BG_CLASSES = ["bg-primary/10", "bg-accent/10", "bg-chart-3/10", "bg-chart-4/10"]

export function CategoryProgress() {
  const [categories, setCategories] = React.useState<CategoryStat[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
    if (!userId) {
      setLoading(false)
      setCategories([])
      return
    }

    fetch(`/api/profile/category-progress?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.categories)) {
          setCategories(
            data.categories.map((c: any, idx: number) => ({
              id: c.id,
              name: c.name,
              total_questions: Number(c.total_questions || 0),
              correct_answers: Number(c.correct_answers || 0),
              answered_questions: Number(c.answered_questions || 0),
              avg_score: c.avg_score !== null ? Number(c.avg_score) : null,
              total_attempts: c.total_attempts !== undefined && c.total_attempts !== null ? Number(c.total_attempts) : null,
            }))
          )
        } else {
          setCategories([])
        }
      })
      .catch((err) => {
        console.warn("Error fetching category progress", err)
        setCategories([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="mb-6">Cargando progreso por categoría...</div>

  if (!categories || categories.length === 0)
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Progreso por Categoría</h2>
        <div className="text-sm text-muted-foreground">No hay datos de progreso aún.</div>
      </div>
    )

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Progreso por Categoría</h2>
      <div className="space-y-4">
        {categories.map((category, idx) => {
          const Icon = ICONS[idx % ICONS.length]
          const bgColor = BG_CLASSES[idx % BG_CLASSES.length]
          const progressPercentage =
            category.total_questions > 0
              ? (category.correct_answers / category.total_questions) * 100
              : 0

          // Mostrar el progreso como respuestas correctas / total de preguntas
          // Antes se usaba `answered_questions` como denominador (lo que mostraba 2/2
          // aunque el quiz tuviera 3 preguntas). Usar siempre `total_questions`.
          const denominator = category.total_questions > 0 ? category.total_questions : 0

          return (
            <Card key={String(category.id)} className="p-5 border-2 transition-all hover:border-primary hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor} shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-foreground">{category.name}</h3>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {category.correct_answers}/{denominator}
                    </span>
                  </div>

                  <Progress value={Math.round(progressPercentage)} className="h-2 mb-3" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cantidad de intentos</span>
                    <span className="font-bold text-foreground">
                      {category.total_attempts !== null && category.total_attempts !== undefined
                        ? category.total_attempts
                        : `-`}
                    </span>
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
