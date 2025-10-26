"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Trophy, Star, Zap, Target, Award, Flame, BookOpen } from "lucide-react"
import { useState } from "react"
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

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "Primer Paso",
      description: "Completa tu primer quiz",
      icon: Star,
      color: "text-primary",
      bgColor: "bg-primary/10",
      unlocked: true,
      progress: 1,
      maxProgress: 1,
      requirement: "Completa 1 quiz",
    },
    {
      id: "2",
      title: "Racha de Fuego",
      description: "Mantén una racha de 7 días",
      icon: Flame,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      unlocked: true,
      progress: 15,
      maxProgress: 7,
      requirement: "Estudia durante 7 días consecutivos",
    },
    {
      id: "3",
      title: "Perfeccionista",
      description: "Obtén 100% en un quiz",
      icon: Target,
      color: "text-accent",
      bgColor: "bg-accent/10",
      unlocked: false,
      progress: 95,
      maxProgress: 100,
      requirement: "Responde correctamente todas las preguntas de un quiz",
    },
    {
      id: "4",
      title: "Velocista",
      description: "Completa 10 quizzes en un día",
      icon: Zap,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      unlocked: false,
      progress: 3,
      maxProgress: 10,
      requirement: "Completa 10 quizzes en un solo día",
    },
    {
      id: "5",
      title: "Maestro",
      description: "Alcanza el nivel 20",
      icon: Award,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
      unlocked: false,
      progress: 12,
      maxProgress: 20,
      requirement: "Alcanza el nivel 20",
    },
    {
      id: "6",
      title: "Experto en BD",
      description: "Completa todos los quizzes de Bases de Datos",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      unlocked: false,
      progress: 8,
      maxProgress: 15,
      requirement: "Completa los 15 quizzes de la categoría Bases de Datos",
    },
  ]

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Logros</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
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
            <DialogDescription className="text-base">{selectedAchievement?.description}</DialogDescription>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Requisito:</h4>
                <p className="text-sm text-muted-foreground">{selectedAchievement.requirement}</p>
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
