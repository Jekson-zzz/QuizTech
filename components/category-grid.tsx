import { CategoryCard } from "@/components/category-card"

const categories = [
  {
    id: "databases",
    title: "Bases de Datos",
    description: "SQL, NoSQL, Modelado y Optimización",
    icon: "Database",
    color: "from-blue-500 to-cyan-500",
    questionCount: 25,
  },
  {
    id: "programming",
    title: "Programación",
    description: "Algoritmos, Estructuras de Datos, POO",
    icon: "Code",
    color: "from-purple-500 to-pink-500",
    questionCount: 30,
  },
  {
    id: "networks",
    title: "Redes",
    description: "Protocolos, Seguridad, Arquitecturas",
    icon: "Network",
    color: "from-green-500 to-emerald-500",
    questionCount: 20,
  },
  {
    id: "architecture",
    title: "Arquitectura",
    description: "Diseño de Software, Patrones, Sistemas",
    icon: "Cpu",
    color: "from-orange-500 to-red-500",
    questionCount: 22,
  },
]

export function CategoryGrid() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-balance text-foreground md:text-4xl">Selecciona una Categoría</h2>
        <p className="text-muted-foreground text-balance">
          Pon a prueba tus conocimientos en diferentes áreas de la ingeniería de sistemas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-6 max-w-4xl mx-auto">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
          97 preguntas disponibles
        </div>
      </div>
    </div>
  )
}
