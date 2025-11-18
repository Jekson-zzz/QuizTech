"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Lock, LogOut, Save } from 'lucide-react'
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'

export default function ConfiguracionPage() {
  const router = useRouter()
  const [name, setName] = useState("María González")
  const [email, setEmail] = useState("maria.gonzalez@example.com")
  const [loadingUser, setLoadingUser] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const body = { userId: userId ? Number(userId) : null, name }
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Error actualizando perfil')
      } else {
        alert('Perfil actualizado correctamente')
      }
    } catch (err) {
      console.error(err)
      alert('Error de red al actualizar perfil')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
    setIsUpdating(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
      const body: any = { userId: userId ? Number(userId) : null, currentPassword, newPassword }
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Error actualizando contraseña')
      } else {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        alert('Contraseña actualizada correctamente')
      }
    } catch (err) {
      console.error(err)
      alert('Error de red al actualizar contraseña')
    } finally {
      setIsUpdating(false)
    }
  }

  const [openLogoutDialog, setOpenLogoutDialog] = useState(false)

  const handleLogout = () => {
    // Abrir diálogo de confirmación en vez del confirm() nativo
    setOpenLogoutDialog(true)
  }

  const performLogout = () => {
    // Limpiar identificadores de sesión locales y redirigir
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userId')
        localStorage.removeItem('accessToken')
        // si hay otras claves relacionadas con sesión, borrarlas aquí
      }
    } catch (e) {
      console.warn('Error limpiando localStorage durante logout', e)
    }
    setOpenLogoutDialog(false)
    router.push('/login')
  }

  // Cargar datos del usuario logeado al montar
  useEffect(() => {
    let mounted = true
    async function loadUser() {
      try {
        const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
        if (!uid) {
          setLoadingUser(false)
          return
        }
        const res = await fetch(`/api/auth/me?id=${encodeURIComponent(uid)}`)
        if (!mounted) return
        if (!res.ok) {
          console.warn('Error fetching current user', await res.text())
          setLoadingUser(false)
          return
        }
        const data = await res.json()
        if (data?.ok && data.user) {
          setName(data.user.name || '')
          setEmail(data.user.email || '')
        }
      } catch (e) {
        console.error('Error loading user data', e)
      } finally {
        if (mounted) setLoadingUser(false)
      }
    }
    loadUser()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Administra tu cuenta y preferencias</p>
        </div>

        <div className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información Personal
              </CardTitle>
              <CardDescription>Actualiza tu nombre y correo electrónico</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingresa tu nombre completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresa tu correo electrónico"
                    required
                  />
                </div>
                <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Cambiar Contraseña
              </CardTitle>
              <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingresa tu nueva contraseña"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirma tu nueva contraseña"
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  {isUpdating ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cerrar Sesión */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </CardTitle>
              <CardDescription>Salir de tu cuenta en este dispositivo</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>

        <Dialog open={openLogoutDialog} onOpenChange={(open) => setOpenLogoutDialog(Boolean(open))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Cerrar Sesión</DialogTitle>
              <DialogDescription>¿Estás seguro de que quieres cerrar sesión? Se cerrará tu sesión en este dispositivo.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => setOpenLogoutDialog(false)} className="">Cancelar</Button>
              <Button variant="destructive" onClick={performLogout} className="">Cerrar Sesión</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
