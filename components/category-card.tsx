"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Database, Code, Network, Cpu, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CategoryCardProps {
  category: {
    id: string
    title: string
    description: string
    icon: string
    color: string
    questionCount: number
  }
}

export function CategoryCard({ category }: CategoryCardProps) {
  const icons: Record<string, LucideIcon> = {
    Database,
    Code,
    Network,
    Cpu,
  }

  const Icon = icons[category.icon] ?? Database

  return (
    <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br",
              category.color,
              "shadow-lg transition-transform group-hover:scale-110",
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {category.questionCount} preguntas
          </div>
        </div>

        <h3 className="mb-2 text-xl font-bold text-card-foreground">{category.title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{category.description}</p>

        <Link href={`/quiz/${category.id}`}>
          <Button className="w-full group/btn" size="lg">
            Comenzar Quiz
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </div>

      <div
        className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-linear-to-br opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
          category.color,
        )}
      />
    </Card>
  )
}
