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
  score: 85,
  correctAnswers: 17,
  totalQuestions: 20,
  timeSpent: 480, // en segundos (8 minutos)
  xpEarned: 250,
  category: "Bases de Datos",
  categoryColor: "from-blue-500 to-cyan-500",
  questions: [
    { id: 1, question: "¿Cuál es la diferencia entre INNER JOIN y LEFT JOIN?", correct: true },
    { id: 2, question: "¿Qué es la normalización de bases de datos?", correct: true },
    { id: 3, question: "¿Cuál es el propósito de una clave primaria?", correct: false },
    { id: 4, question: "¿Qué significa ACID en bases de datos?", correct: true },
    { id: 5, question: "¿Cuándo usar índices en una tabla?", correct: true },
    { id: 6, question: "¿Qué es una transacción en SQL?", correct: true },
    { id: 7, question: "¿Cuál es la diferencia entre DELETE y TRUNCATE?", correct: false },
    { id: 8, question: "¿Qué es un procedimiento almacenado?", correct: true },
    { id: 9, question: "¿Para qué sirve la cláusula GROUP BY?", correct: true },
    { id: 10, question: "¿Qué es una vista en SQL?", correct: true },
    { id: 11, question: "¿Cuál es la diferencia entre UNION y UNION ALL?", correct: true },
    { id: 12, question: "¿Qué es un trigger en bases de datos?", correct: false },
    { id: 13, question: "¿Cuándo usar una base de datos NoSQL?", correct: true },
    { id: 14, question: "¿Qué es la desnormalización?", correct: true },
    { id: 15, question: "¿Cuál es el propósito de las claves foráneas?", correct: true },
    { id: 16, question: "¿Qué es un deadlock?", correct: true },
    { id: 17, question: "¿Cuál es la diferencia entre VARCHAR y CHAR?", correct: true },
    { id: 18, question: "¿Qué es el modelo entidad-relación?", correct: true },
    { id: 19, question: "¿Para qué sirve la cláusula HAVING?", correct: true },
    { id: 20, question: "¿Qué es la integridad referencial?", correct: true },
  ],
  newAchievements: [
    {
      id: "speed",
      title: "Velocista",
      description: "Completaste el quiz en menos de 10 minutos",
      icon: Zap,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ],
  achievementProgress: [
    {
      id: "perfectionist",
      title: "Perfeccionista",
      description: "Obtén 100% en un quiz",
      progress: 85,
      maxProgress: 100,
      icon: Target,
    },
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
  }>(null)

  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      const raw = sessionStorage.getItem("lastQuizResult")
      if (!raw) return
      const parsed = JSON.parse(raw)
      // minimal validation
      if (
        typeof parsed.score === "number" &&
        typeof parsed.correctAnswers === "number" &&
        typeof parsed.totalQuestions === "number" &&
        typeof parsed.timeSpent === "number"
      ) {
        setDynamicResults(parsed)

        // Enviar al backend para persistir (y eliminar la clave para evitar reposts)
        const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
        if (userId) {
          fetch("/api/quiz/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: Number(userId),
              score: parsed.score,
              durationSeconds: parsed.timeSpent,
              category: parsed.category || category,
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                console.warn('POST /api/quiz/complete failed', await res.text())
                return
              }
              console.log('Quiz result sent to server successfully')
              // remove stored result to avoid duplicate submissions
              sessionStorage.removeItem("lastQuizResult")
              // opcional: refrescar la página para que el perfil muestre los cambios inmediatamente
              try {
                if (typeof window !== 'undefined') {
                  // Intencionadamente simple: recargar para que /profile haga fetch de nuevo
                  // Puedes cambiar esto por una navegación /profile o por invalidación más fina
                  // router.push('/profile')
                }
              } catch (e) {
                // ignore
              }
            })
            .catch((err) => {
              console.warn('Network error sending quiz result:', err)
              // keep stored result so user can retry by reloading
            })
        } else {
          console.warn('No userId found in localStorage; quiz result saved in sessionStorage for later delivery')
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
        questions: resultsData.questions.slice(0, dynamicResults.totalQuestions),
        newAchievements: resultsData.newAchievements,
        achievementProgress: resultsData.achievementProgress,
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
                    <p className="text-sm text-foreground font-medium">
                      {index + 1}. {q.question}
                    </p>
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
        {newAchievements.length > 0 && (
          <Card className="p-6 mb-6 border-2 bg-linear-to-br from-primary/5 to-accent/5">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              ¡Nuevos Logros Desbloqueados!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newAchievements.map((achievement) => {
                const Icon = achievement.icon
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-card border-2 border-primary/20 shadow-sm"
                  >
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${achievement.bgColor}`}>
                      <Icon className={`h-7 w-7 ${achievement.color}`} />
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
                const Icon = achievement.icon
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
            className="flex-1 border-2 py-4 h-12 text-base sm:py-2 sm:h-auto sm:text-sm"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Reintentar Quiz
          </Button>
          <Button
            size="lg"
            onClick={() => router.push("/inicio")}
            className="flex-1 bg-linear-to-r from-primary to-accent hover:opacity-90 py-4 h-12 text-base sm:py-2 sm:h-auto sm:text-sm"
          >
            <Home className="mr-2 h-5 w-5" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
