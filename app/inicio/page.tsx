import { CategoryGrid } from "@/components/category-grid"
import { Header } from "@/components/header"
import { UserGreeting } from "@/components/user-greeting"

export default function Inicio() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-6">
        <UserGreeting userName="Carlos" level={5} streak={12} />
        <CategoryGrid />
      </div>
    </main>
  )
}
