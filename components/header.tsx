"use client"

import { Brain, Home, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold leading-tight text-foreground">QuizTech</h1>
            <p className="text-xs text-muted-foreground">Ingeniería de Sistemas</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant={pathname === "/" ? "secondary" : "ghost"} size="sm" asChild className="gap-2">
            <Link href="/inicio">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </Button>
          <Button variant={pathname === "/perfil" ? "secondary" : "ghost"} size="sm" asChild className="gap-2">
            <Link href="/profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
          </Button>
          <Button variant={pathname === "/configuracion" ? "secondary" : "ghost"} size="sm" asChild className="gap-2">
            <Link href="/configuracion">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
