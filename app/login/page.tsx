"use client"

import type React from "react"

import { Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usuario, password })
      })

      const data = await res.json()

      if (!res.ok) {
        // Mostrar mensaje enviado por la API o uno genérico, con feedback de intentos/bloqueo
        if (res.status === 423) {
          // Cuenta bloqueada
          if (data?.lockedUntil) {
            const until = new Date(data.lockedUntil)
            setError(`Cuenta bloqueada hasta ${until.toLocaleString()}. Intenta más tarde.`)
          } else if (data?.lockedUntilMinutes) {
            setError(`Cuenta bloqueada por demasiados intentos. Intenta nuevamente en ${data.lockedUntilMinutes} minutos.`)
          } else {
            setError(data?.error || 'Cuenta bloqueada temporalmente')
          }
        } else if (data?.attemptsLeft != null) {
          setError(`${data.error || 'Credenciales inválidas'}. Te quedan ${data.attemptsLeft} intentos.`)
        } else {
          setError(data?.error || 'Error al iniciar sesión')
        }

        setLoading(false)
        return
      }

      // Autenticación correcta — guardamos un flag simple y redirigimos
      try {
        if (data?.userId) localStorage.setItem('userId', String(data.userId))
        localStorage.setItem('isLogged', 'true')
      } catch (e) {
        // en entornos donde localStorage no está disponible, no bloquear
        console.warn('No se pudo acceder a localStorage', e)
      }

      setLoading(false)
      router.push('/inicio')
    } catch (err) {
      console.error(err)
      setError('Error de red, inténtalo de nuevo')
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

        {/* Formulario de login */}
        <Card className="p-6 shadow-xl border-border/50 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-foreground">
                Usuario
              </Label>
              <Input
                id="usuario"
                type="text"
                placeholder="ingresa tu usuario o correo"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">
                  Contraseña
                </Label>

              </div>
              <Input
                id="password"
                type="password"
                placeholder="ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />

              <Link
                href="/recu-pass"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Al continuar, aceptas nuestros{' '}
          <Link href="/terminos" className="text-primary hover:underline">
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  )
}
