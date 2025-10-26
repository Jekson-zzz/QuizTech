"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

interface AnswerOptionsProps {
  type: "multiple" | "boolean"
  options?: string[]
  selectedAnswer: number | null
  onSelect: (index: number) => void
  isAnswered: boolean
  correctAnswer?: number
}

export function AnswerOptions({
  type,
  options,
  selectedAnswer,
  onSelect,
  isAnswered,
  correctAnswer,
}: AnswerOptionsProps) {
  const booleanOptions = ["Verdadero", "Falso"]
  const displayOptions = type === "boolean" ? booleanOptions : options || []

  return (
    <div className="space-y-3">
      {displayOptions.map((option, index) => {
        const isSelected = selectedAnswer === index
        const isCorrect = isAnswered && correctAnswer === index
        const isWrong = isAnswered && isSelected && correctAnswer !== index

        return (
          <Card
            key={index}
            onClick={() => !isAnswered && onSelect(index)}
            className={cn(
              "cursor-pointer border-2 p-4 transition-all hover:shadow-md",
              !isAnswered && "hover:border-primary",
              isSelected && !isAnswered && "border-primary bg-primary/5",
              isCorrect && "border-green-500 bg-green-500/10",
              isWrong && "border-destructive bg-destructive/10",
              isAnswered && "cursor-default",
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                  !isAnswered && !isSelected && "border-muted-foreground/30 text-muted-foreground",
                  !isAnswered && isSelected && "border-primary bg-primary text-primary-foreground",
                  isCorrect && "border-green-500 bg-green-500 text-white",
                  isWrong && "border-destructive bg-destructive text-destructive-foreground",
                )}
              >
                {isCorrect ? (
                  <Check className="h-5 w-5" />
                ) : isWrong ? (
                  <X className="h-5 w-5" />
                ) : (
                  String.fromCharCode(65 + index)
                )}
              </div>
              <p className="flex-1 text-base leading-relaxed text-card-foreground md:text-lg">{option}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
