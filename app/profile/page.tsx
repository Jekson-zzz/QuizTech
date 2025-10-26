"use client"

import { Header } from "@/components/header"
import { ProfileHeader } from "@/components/profile-header"
import { StatsGrid } from "@/components/stats-grid"
import { AchievementsSection } from "@/components/achievements-section"
import { CategoryProgress } from "@/components/category-progress"

export default function ProfilePage() {
  // Datos de ejemplo del usuario
  const userData = {
    name: "María González",
    level: 12,
    currentXP: 2450,
    xpToNextLevel: 3000,
    stats: {
      quizzesCompleted: 47,
      averageScore: 87,
      streak: 15,
      studyTime: 1240, // en minutos
    },
  }

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
