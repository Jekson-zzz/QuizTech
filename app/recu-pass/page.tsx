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
  const [stage, setStage] = useState<'verify' | 'set' | 'done'>('verify')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'No se pudo verificar el usuario')
        setLoading(false)
        return
      }
      setStage('set')
    } catch (err) {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'No se pudo actualizar la contraseña')
        setLoading(false)
        return
      }
      setStage('done')
    } catch (err) {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-accent/5 to-background p-4">
      <div className="w-full max-w-md">
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

        <Card className="p-6 shadow-xl border-border/50 backdrop-blur">
          {stage === 'verify' && (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Verifica tu usuario</h2>
                <p className="text-sm text-muted-foreground">Ingresa tu nombre de usuario y correo para continuar</p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">Nombre de usuario</Label>
                  <Input id="username" placeholder="usuario123" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
                  <Input id="email" type="email" placeholder="usuario@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full h-11 bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold">
                  {loading ? 'Verificando...' : 'Verificar usuario'}
                </Button>
              </form>
            </>
          )}

          {stage === 'set' && (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Establece una nueva contraseña</h2>
                <p className="text-sm text-muted-foreground">Introduce la nueva contraseña para tu cuenta</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">Nueva contraseña</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">Confirmar contraseña</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11" />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full h-11 bg-linear-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold">
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </form>
            </>
          )}

          {stage === 'done' && (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-muted-foreground mb-6">Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión con la nueva contraseña.</p>
              <Button onClick={() => (window.location.href = '/login')} className="w-full">Ir a iniciar sesión</Button>
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
