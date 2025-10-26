import { Card } from "@/components/ui/card"
import { Code2, ImageIcon } from "lucide-react"
import Image from "next/image"

interface QuestionDisplayProps {
  question: string
  code?: string
  codeLanguage?: string
  image?: string
  hasCode?: boolean
  hasImage?: boolean
}

export function QuestionDisplay({ question, code, codeLanguage, image, hasCode, hasImage }: QuestionDisplayProps) {
  return (
    <Card className="border-2 p-6 md:p-8">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold leading-relaxed text-card-foreground md:text-2xl text-balance">
          {question}
        </h2>

        {hasCode && code && (
          <div className="relative overflow-hidden rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase text-muted-foreground">{codeLanguage || "code"}</span>
            </div>
            <pre className="overflow-x-auto p-4">
              <code className="text-sm font-mono text-foreground">{code}</code>
            </pre>
          </div>
        )}

        {hasImage && image && (
          <div className="relative overflow-hidden rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase text-muted-foreground">Diagrama</span>
            </div>
            <div className="relative aspect-video w-full">
              <Image src={image || "/placeholder.svg"} alt="Question diagram" fill className="object-contain p-4" />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
