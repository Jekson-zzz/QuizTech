"use client"

import React, { useEffect, useState } from 'react'
import { UserGreeting } from './user-greeting'

export function UserGreetingWrapper() {
  const [name, setName] = useState<string | undefined>(undefined)
  const [level, setLevel] = useState<number | undefined>(undefined)
  const [streak, setStreak] = useState<number | undefined>(undefined)
  const [averageScore, setAverageScore] = useState<number | undefined>(undefined)

  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!userId) {
      setName(undefined)
      return
    }

    let mounted = true
    fetch(`/api/auth/me?id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        if (data?.ok && data.user) {
          setName(data.user.name)
          setLevel(data.user.level)
          setStreak(data.user.streak)
          setAverageScore(typeof data.user.averageScore === 'number' ? Math.round(data.user.averageScore) : undefined)
        }
      })
      .catch((err) => console.warn('Error fetching user profile', err))

    return () => {
      mounted = false
    }
  }, [])
  // Nota: se eliminó la lógica de temporizador de estudio a petición del usuario

  return (
    <UserGreeting
      userName={name}
      level={level ?? 1}
      streak={streak ?? 0}
    />
  )
}
