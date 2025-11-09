"use client"

import React from 'react'
import { Header } from "@/components/header"
import { ProfileHeader } from "@/components/profile-header"
import { StatsGrid } from "@/components/stats-grid"
import { AchievementsSection } from "@/components/achievements-section"
import { CategoryProgress } from "@/components/category-progress"

export default function ProfilePage() {
  // Estado del usuario (valores por defecto neutrales para evitar datos de ejemplo)
  const [userData, setUserData] = React.useState({
    name: '',
    level: 1,
    currentXP: 0,
    xpToNextLevel: 0,
    stats: {
      quizzesCompleted: 0,
      averageScore: 0,
      streak: 0,
    },
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
    if (!userId) {
      setLoading(false)
      return
    }

    fetch(`/api/auth/me?id=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.user) {
          setUserData((prev) => ({
            ...prev,
            name: data.user.name ?? prev.name,
            level: typeof data.user.level === 'number' ? data.user.level : prev.level,
            currentXP: typeof data.user.currentXP === 'number' ? data.user.currentXP : prev.currentXP,
            xpToNextLevel: typeof data.user.xpToNextLevel === 'number' ? data.user.xpToNextLevel : prev.xpToNextLevel,
            stats: {
              ...prev.stats,
              quizzesCompleted: typeof data.user.quizzesCompleted === 'number' ? data.user.quizzesCompleted : prev.stats.quizzesCompleted,
              averageScore: typeof data.user.averageScore === 'number' ? Math.round(data.user.averageScore) : prev.stats.averageScore,
              streak: typeof data.user.streak === 'number' ? data.user.streak : prev.stats.streak,
            },
          }))
        }
      })
      .catch((err) => console.warn('Error fetching profile', err))
      .finally(() => setLoading(false))
  }, [])

  // userData ahora proviene del estado y se actualiza desde la API

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <ProfileHeader
          name={userData.name}
          level={userData.level}
          currentXP={userData.currentXP}
          xpToNextLevel={userData.xpToNextLevel}
        />

        <StatsGrid stats={userData.stats} />

        <AchievementsSection />

        <CategoryProgress />
      </main>
    </div>
  )
}
