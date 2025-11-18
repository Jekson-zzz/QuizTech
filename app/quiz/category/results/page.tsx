"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Clock, Zap, CheckCircle, XCircle, Home, RotateCcw, Star, Target } from "lucide-react"

// Datos de ejemplo para los resultados
const resultsData = {
  score: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  timeSpent: 0, // en segundos (0 minutos)
  xpEarned: 0,
  category: "Bases de Datos",
  categoryColor: "from-blue-500 to-cyan-500",
  questions: [

  ],
  newAchievements: [
 
  ],
  achievementProgress: [

  ],
}

export default function QuizResultsPage() {
  const params = useParams()
  const router = useRouter()
  const category = params.category as string

  // Estado para datos dinámicos del quiz (si vienen de sessionStorage)
  const [dynamicResults, setDynamicResults] = useState<null | {
    score: number
    correctAnswers: number
    totalQuestions: number
    timeSpent: number
    category?: string
    details?: Array<{
      id: number
      question: string
      selected?: string | number
      correctAnswer?: string | number
      correct?: boolean
      options?: Array<{ id: number; text: string }>
    }>
  }>(null)
  const [serverNewAchievements, setServerNewAchievements] = useState<any[]>([])
  const [serverAchievementProgress, setServerAchievementProgress] = useState<any[]>([])
  const [serverXpEarned, setServerXpEarned] = useState<number | null>(null)

  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      const raw = sessionStorage.getItem("lastQuizResult")
      if (!raw) return
      const parsed = JSON.parse(raw)

      const safe = {
        score: typeof parsed.score === "number" ? parsed.score : undefined,
        correctAnswers: typeof parsed.correctAnswers === "number" ? parsed.correctAnswers : undefined,
        totalQuestions: typeof parsed.totalQuestions === "number" ? parsed.totalQuestions : undefined,
        timeSpent: typeof parsed.timeSpent === "number" ? parsed.timeSpent : undefined,
        category: typeof parsed.category === "string" ? parsed.category : undefined,
        details: Array.isArray(parsed.details) ? parsed.details : undefined,
      }

      if (safe.details) {
        const total = safe.details.length
        const correctCount = safe.details.filter((d: any) => d.correct === true).length
        if (typeof safe.score !== "number") safe.score = Math.round((correctCount / total) * 100)
        if (typeof safe.correctAnswers !== "number") safe.correctAnswers = correctCount
        if (typeof safe.totalQuestions !== "number") safe.totalQuestions = total
      }

      if (
        (typeof safe.score === "number" && typeof safe.correctAnswers === "number" && typeof safe.totalQuestions === "number" && typeof safe.timeSpent === "number") ||
        (safe.details && typeof safe.timeSpent === "number") ||
        (safe.details && typeof safe.correctAnswers === "number")
      ) {
        const final = {
          score: typeof safe.score === "number" ? safe.score : Math.round(((safe.correctAnswers || 0) / (safe.totalQuestions || 1)) * 100),
          correctAnswers: typeof safe.correctAnswers === "number" ? safe.correctAnswers : 0,
          totalQuestions: typeof safe.totalQuestions === "number" ? safe.totalQuestions : safe.details ? safe.details.length : 0,
          timeSpent: typeof safe.timeSpent === "number" ? safe.timeSpent : 0,
          category: safe.category,
          details: safe.details,
        }
        setDynamicResults(final as any)

        // Enviar al backend para persistir (opcional, similar a la otra versión)
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
        const clientQuizId = typeof window !== 'undefined' ? sessionStorage.getItem('clientQuizId') : null
        if (userId && typeof final.score === "number") {
          const body = {
            userId: Number(userId),
            score: final.score,
            durationSeconds: final.timeSpent,
            category: final.category || category,
            details: final.details,
            clientQuizId: clientQuizId || undefined,
            final: true,
          }
          fetch("/api/quiz/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then(async (res) => {
            if (!res.ok) {
              console.warn('POST /api/quiz/complete failed', await res.text())
              return
            }
            const resultsData = await res.json()
            // server returns newAchievements (basic data). Map to UI-friendly objects.
            try {
              const raw = Array.isArray(resultsData.newAchievements) ? resultsData.newAchievements : []
              const mapped = raw.map((a: any) => ({
                id: a.id || a.key || JSON.stringify(a),
                title: a.title || a.key || 'Logro',
                description: a.description || '',
                // use default icon/colors for server-sent achievements
                icon: Trophy,
                color: 'text-primary',
                bgColor: 'bg-primary/10',
              }))
              setServerNewAchievements(mapped)
              // ahora solicitar progreso cercano para el usuario (top 3)
              try {
                const uid = String(userId)
                const achRes = await fetch(`/api/achievements?id=${encodeURIComponent(uid)}`)
                if (achRes.ok) {
                          const achData = await achRes.json()
                          console.log('DEBUG /api/achievements response:', achData)
                  const list = Array.isArray(achData.achievements) ? achData.achievements : []
                  const mappedProg = list.map((a: any) => {
                    let progress = undefined as number | undefined
                    let maxProgress = undefined as number | undefined
                    if (a.extra && typeof a.extra === 'object') {
                      if (typeof a.extra.progress === 'number') progress = a.extra.progress
                      if (typeof a.extra.target === 'number') maxProgress = a.extra.target
                    }
                    if (maxProgress === undefined && a.criteria) {
                      if (typeof a.criteria.count === 'number') maxProgress = a.criteria.count
                      if (typeof a.criteria.days === 'number') maxProgress = a.criteria.days
                      if (typeof a.criteria.level === 'number') maxProgress = a.criteria.level
                      if (typeof a.criteria.score === 'number') maxProgress = a.criteria.score
                    }
                    // If achievement is score-based, derive progress from the best of prior progress and this quiz score
                    try {
                      const quizScore = typeof final?.score === 'number' ? final.score : undefined
                      if (typeof quizScore === 'number' && typeof maxProgress === 'number' && a.criteria && typeof a.criteria.score === 'number') {
                        const candidate = Math.min(quizScore, maxProgress)
                        if (typeof progress === 'number') {
                          progress = Math.max(progress, candidate)
                        } else {
                          progress = candidate
                        }
                      }
                    } catch (e) {
                      // ignore
                    }
                    return {
                      id: a.id,
                      key: a.key,
                      title: a.title,
                      description: a.description,
                      unlocked: !!a.unlocked,
                      progress,
                      maxProgress,
                    }
                  })
                  const near = mappedProg
                    .filter((a: any) => !a.unlocked && typeof a.progress === 'number' && typeof a.maxProgress === 'number' && a.progress < a.maxProgress)
                    .map((a: any) => ({ ...a, pct: a.progress / a.maxProgress }))
                    .sort((x: any, y: any) => y.pct - x.pct)
                    .slice(0, 3)
                          console.log('DEBUG mappedProg:', mappedProg)
                          console.log('DEBUG near(top3):', near)
                  setServerAchievementProgress(near)
                }
              } catch (e) {
                // ignore
              }
            } catch (e) {
              setServerNewAchievements([])
            }
            try { setServerXpEarned(typeof resultsData.xpEarned === 'number' ? Number(resultsData.xpEarned) : null) } catch (e) { setServerXpEarned(null) }
            sessionStorage.removeItem("lastQuizResult")
            sessionStorage.removeItem('clientQuizId')
          }).catch((err) => {
            console.warn('Network error sending quiz result:', err)
          })
        }
      }
    } catch (e) {
      // ignore parsing errors
    }
  }, [category])

  const {
    score,
    correctAnswers,
    totalQuestions,
    timeSpent,
    xpEarned,
    questions,
    newAchievements,
    achievementProgress,
  } = dynamicResults
    ? {
        score: dynamicResults.score,
        correctAnswers: dynamicResults.correctAnswers,
        totalQuestions: dynamicResults.totalQuestions,
        timeSpent: dynamicResults.timeSpent,
        xpEarned: 0,
        questions: dynamicResults.details
          ? dynamicResults.details.map((d) => ({ id: d.id, question: d.question, correct: !!d.correct, selected: d.selected, correctAnswer: d.correctAnswer, options: d.options }))
          : resultsData.questions.slice(0, dynamicResults.totalQuestions),
        newAchievements: serverNewAchievements.length > 0 ? serverNewAchievements : [],
        achievementProgress: serverAchievementProgress.length > 0 ? serverAchievementProgress : (resultsData.achievementProgress || []),
      }
    : resultsData

  // Determinar el mensaje de desempeño
  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return { text: "¡Excelente!", color: "text-chart-3", emoji: "🎉" }
    if (score >= 70) return { text: "¡Bien Hecho!", color: "text-primary", emoji: "👏" }
    if (score >= 50) return { text: "Puedes Mejorar", color: "text-chart-4", emoji: "💪" }
    return { text: "Sigue Practicando", color: "text-muted-foreground", emoji: "📚" }
  }

  const performance = getPerformanceMessage(score)

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header de Resultados */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-primary to-accent mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${performance.color}`}>
            {performance.emoji} {performance.text}
          </h1>
          <p className="text-muted-foreground text-lg">Has completado el quiz de {resultsData.category}</p>
        </div>

        {/* Estadísticas Principales */}
        <Card className="p-6 mb-6 border-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{score}%</div>
              <p className="text-sm text-muted-foreground">Puntuación</p>
              <p className="text-xs text-muted-foreground mt-1">
                {correctAnswers} de {totalQuestions}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-accent mr-1" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{formatTime(timeSpent)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Tiempo</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-chart-4 mr-1" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">+{xpEarned}</span>
              </div>
              <p className="text-sm text-muted-foreground">XP Ganada</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-chart-3 mr-1" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">{correctAnswers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Correctas</p>
            </div>
          </div>
        </Card>

        {/* Desglose de Preguntas */}
        <Card className="p-6 mb-6 border-2">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-primary" />
            Desglose de Preguntas
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  q.correct
                    ? "bg-chart-3/5 border-chart-3/20 hover:bg-chart-3/10"
                    : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {q.correct ? (
                    <CheckCircle className="w-5 h-5 text-chart-3" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">
                        {index + 1}. {q.question}
                      </p>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {(q as any).selected !== undefined && (
                          <div>
                            <strong className="text-foreground mr-1">Tu respuesta:</strong>
                            <span>{String((q as any).selected)}</span>
                          </div>
                        )}
                        {(q as any).correctAnswer !== undefined && (
                          <div>
                            <strong className="text-foreground mr-1">Respuesta correcta:</strong>
                            <span>{String((q as any).correctAnswer)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={q.correct ? "secondary" : "ghost"}
                      className={`${q.correct ? "" : "text-destructive"} shrink-0 text-xs`}
                    >
                      {q.correct ? "Correcta" : "Incorrecta"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Logros Desbloqueados */}
        {(serverNewAchievements.length > 0 ? serverNewAchievements : newAchievements).length > 0 && (
          <Card className="p-6 mb-6 border-2 bg-linear-to-br from-primary/5 to-accent/5">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              ¡Nuevos Logros Desbloqueados!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(serverNewAchievements.length > 0 ? serverNewAchievements : newAchievements).map((achievement) => {
                const Icon = achievement.icon || Trophy
                const bg = achievement.bgColor || 'bg-primary/10'
                const color = achievement.color || 'text-primary'
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-card border-2 border-primary/20 shadow-sm"
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-7 w-7 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <Star className="w-6 h-6 text-chart-4 fill-chart-4 animate-pulse" />
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Progreso hacia Logros */}
        {achievementProgress.length > 0 && (
          <Card className="p-6 mb-6 border-2">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Progreso hacia Logros
            </h2>
            <div className="space-y-4">
              {achievementProgress.map((achievement) => {
                const Icon = achievement.icon || Target
                const progressPercent = (achievement.progress / achievement.maxProgress) * 100
                return (
                  <div key={achievement.id} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{achievement.title}</h3>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {achievement.progress}/{achievement.maxProgress}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push(`/quiz/${category}`)}
            className="flex-1 border-2"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reintentar Quiz
          </Button>
          <Button
            size="lg"
            onClick={() => router.push('/inicio')}
            className="flex-1 bg-linear-to-r from-primary to-accent hover:opacity-90"
          >
            <Home className="mr-2 h-5 w-5" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
