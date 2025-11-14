import CategoryGrid from "@/components/category-grid"
import { Header } from "@/components/header"
import { UserGreetingWrapper } from "@/components/user-greeting-wrapper"

export default function Inicio() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-6">
  <UserGreetingWrapper />
        <CategoryGrid />
      </div>
    </main>
  )
}
