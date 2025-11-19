import { Card } from "@/components/ui/card"
import { CheckCircle, Info, XCircle } from "lucide-react"

interface ExplanationBoxProps {
  isCorrect: boolean
  explanation?: string | null
  correctText?: string | null
}

export function ExplanationBox({ isCorrect, explanation, correctText }: ExplanationBoxProps) {
  return (
    <Card className={`border-2 p-4 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-destructive bg-destructive/5'}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">
          {isCorrect ? <CheckCircle className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-destructive" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base leading-snug text-card-foreground">
            {isCorrect ? 'Respuesta Correcta' : 'Respuesta Incorrecta'}
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            {explanation ? (
              <>
                {isCorrect ? (
                  <p className="whitespace-normal wrap-break-word">Buena elección — te explico el por qué 🤓</p>
                ) : (
                  <p className="whitespace-normal wrap-break-word">Elección incorrecta — te explico por qué 🤓</p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">📚 {explanation}</p>
              </>
            ) : (
              <>
                {isCorrect ? (
                  <p className="whitespace-normal">Buena elección. No hay explicación adicional disponible.</p>
                ) : (
                  <>
                    <p className="whitespace-normal">Respuesta incorrecta. No hay explicación adicional disponible.</p>
                    <p className="mt-2 whitespace-normal">La respuesta correcta es: <strong className="wrap-break-word whitespace-normal">{correctText ?? '—'}</strong></p>
                  </>
                )}
                <p className="mt-2 text-xs text-muted-foreground"><Info className="inline h-4 w-4 mr-1 align-text-bottom" /> Se añadira proximamente la explicacion de esta respuesta.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
