"use client"

import type React from "react"
import { Brain, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<"email" | "username">("email")
  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí irá la lógica de recuperación de contraseña
    console.log("Password recovery attempt:", { method, value })
    setSubmitted(true)
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
          <p className="text-muted-foreground">Recuperar contraseña</p>
        </div>

        {/* Formulario de recuperación */}
        <Card className="p-6 shadow-xl border-border/50 backdrop-blur">
          {!submitted ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">¿Olvidaste tu contraseña?</h2>
                <p className="text-sm text-muted-foreground">No te preocupes, te ayudaremos a recuperarla</p>
              </div>

              {/* Selector de método */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                    method === "email"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="font-medium text-sm">Correo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("username")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                    method === "username"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium text-sm">Usuario</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="recovery-input" className="text-foreground">
                    {method === "email" ? "Correo electrónico" : "Nombre de usuario"}
                  </Label>
                  <Input
                    id="recovery-input"
                    type={method === "email" ? "email" : "text"}
                    placeholder={method === "email" ? "tu@email.com" : "tu_usuario"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold"
                >
                  Enviar enlace de recuperación
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                ¡Revisa tu {method === "email" ? "correo" : "cuenta"}!
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Hemos enviado un enlace de recuperación a tu {method === "email" ? "correo electrónico" : "cuenta"}.
                Sigue las instrucciones para restablecer tu contraseña.
              </p>
              <Button
                onClick={() => {
                  setSubmitted(false)
                  setValue("")
                }}
                variant="outline"
                className="w-full"
              >
                Volver a intentar
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
              Volver al inicio de sesión
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
