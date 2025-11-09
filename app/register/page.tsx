"use client"

import type React from "react"
import { Brain, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Error al crear la cuenta')
        setLoading(false)
        return
      }

      // Registro exitoso — redirigir a login o página inicial
      router.push('/login')
    } catch (err) {
      console.error(err)
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-accent/5 to-background p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-br from-primary to-accent blur-xl opacity-50 rounded-full" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent shadow-lg">
                <Brain className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">QuizTech</h1>
          <p className="text-muted-foreground">Ingeniería de Sistemas</p>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="mb-6 p-4 rounded-lg bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">¡Bienvenido a QuizTech!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Únete a nuestra comunidad de estudiantes de ingeniería. Mejora tus conocimientos, completa desafíos y
                alcanza nuevos niveles.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de registro */}
        <Card className="p-6 shadow-xl border-border/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">
                Nombre completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold"
            >
              {loading ? 'Creando...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          Al registrarte, aceptas nuestros{" "}
          <Link href="/terminos" className="text-primary hover:underline">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  )
}
