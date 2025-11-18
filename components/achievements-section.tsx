"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Trophy, Star, Zap, Target, Award, Flame, BookOpen } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface Achievement {
  id: string
  title: string
  description: string
  icon: typeof Trophy
  color: string
  bgColor: string
  unlocked: boolean
  progress?: number
  maxProgress?: number
  requirement: string
}

export function AchievementsSection() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [achievements, setAchievements] = useState<Achievement[] | null>(null)
  const [loading, setLoading] = useState(false)

  // Mapear claves de logros a iconos locales y estilos
  const iconMap: Record<string, { icon: any; color: string; bgColor: string }> = {
    first_quiz: { icon: Star, color: 'text-primary', bgColor: 'bg-primary/10' },
    streak_7: { icon: Flame, color: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    perfect_quiz: { icon: Target, color: 'text-accent', bgColor: 'bg-accent/10' },
    fast_10: { icon: Zap, color: 'text-chart-4', bgColor: 'bg-chart-4/10' },
    level_50: { icon: Award, color: 'text-chart-5', bgColor: 'bg-chart-5/10' },
    complete_all: { icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary/10' },
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        const url = '/api/achievements' + (userId ? `?id=${encodeURIComponent(userId)}` : '')
        const res = await fetch(url)
        if (!res.ok) {
          console.warn('Failed to load achievements', await res.text())
          setAchievements([])
          setLoading(false)
          return
        }
        const data = await res.json()
        const list = Array.isArray(data.achievements) ? data.achievements : []

        const mapped: Achievement[] = list.map((a: any) => {
          const map = iconMap[a.key] || { icon: Star, color: 'text-muted-foreground', bgColor: 'bg-muted' }

          // intentar derivar progreso desde extra o criteria
          let progress = undefined as number | undefined
          let maxProgress = undefined as number | undefined
          if (a.extra && typeof a.extra === 'object') {
            if (typeof a.extra.progress === 'number') progress = a.extra.progress
            if (typeof a.extra.target === 'number') maxProgress = a.extra.target
          }
          // criterios comunes
          if (maxProgress === undefined && a.criteria) {
            if (typeof a.criteria.count === 'number') maxProgress = a.criteria.count
            if (typeof a.criteria.days === 'number') maxProgress = a.criteria.days
            if (typeof a.criteria.level === 'number') maxProgress = a.criteria.level
            if (typeof a.criteria.score === 'number') maxProgress = a.criteria.score
          }

          // Si progress no viene pero logro está desbloqueado, mostrar progreso = max
          if (progress === undefined && a.unlocked && typeof maxProgress === 'number') progress = maxProgress

          return {
            id: String(a.id),
            title: a.title,
            description: a.description,
            icon: map.icon,
            color: map.color,
            bgColor: map.bgColor,
            unlocked: !!a.unlocked,
            progress,
            maxProgress,
            requirement: a.criteria ? JSON.stringify(a.criteria) : '',
          }
        })

        setAchievements(mapped)
      } catch (e) {
        console.error(e)
        setAchievements([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // if achievements not yet loaded, show empty placeholder
  const visibleAchievements = achievements ?? []

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Logros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {visibleAchievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <Card
                key={achievement.id}
                className={`p-4 border-2 transition-all cursor-pointer ${
                  achievement.unlocked ? "hover:border-primary hover:shadow-lg" : "opacity-60 hover:opacity-80"
                }`}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${achievement.bgColor} ${
                      achievement.unlocked ? "shadow-lg" : ""
                    }`}
                  >
                    <Icon className={`h-8 w-8 ${achievement.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground mb-1">{achievement.title}</h3>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="text-xs">
                        Desbloqueado
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              {selectedAchievement && (
                <>
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${selectedAchievement.bgColor}`}
                  >
                    <selectedAchievement.icon className={`h-8 w-8 ${selectedAchievement.color}`} />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedAchievement.title}</DialogTitle>
                    {selectedAchievement.unlocked && (
                      <Badge variant="secondary" className="mt-2">
                        Desbloqueado
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Requisito:</h4>
                <p className="text-sm text-muted-foreground">{selectedAchievement.description}</p>
              </div>

              {selectedAchievement.progress !== undefined && selectedAchievement.maxProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-bold text-foreground">
                      {selectedAchievement.progress} / {selectedAchievement.maxProgress}
                    </span>
                  </div>
                  <Progress
                    value={(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}
                    className="h-2"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
