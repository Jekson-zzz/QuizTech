import { Progress } from "@/components/ui/progress"

interface QuizProgressProps {
  current: number
  total: number
  progress: number
}

export function QuizProgress({ current, total, progress }: QuizProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">
          Pregunta {current} de {total}
        </span>
        <span className="font-bold text-primary">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
