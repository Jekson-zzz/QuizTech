import { CategoryCard } from "@/components/category-card"
import mysql from 'mysql2/promise'

async function fetchCategories() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  })

  // Traemos las categorías y el conteo aproximado de preguntas asociadas
  const [rows] = await conn.execute(`
    SELECT c.id, c.name, c.description,
      COALESCE(counts.q_count, 0) AS questionCount
    FROM categories c
    LEFT JOIN (
      SELECT s.category_id AS cat_id, COUNT(DISTINCT q.id) AS q_count
      FROM scenarios s
      LEFT JOIN questions q ON q.scenario_id = s.id
      GROUP BY s.category_id
    ) AS counts ON counts.cat_id = c.id
    ORDER BY c.name ASC
  `)

  await conn.end()

  // Mapear a la forma que espera CategoryCard
  return (rows as any[]).map((r) => ({
  id: String(r.id),
  title: r.name || `Categoria ${r.id}`,
    description: r.description || '',
    icon: 'Database', // default icon — puedes mejorar esto guardando icon en la tabla
    color: 'from-blue-500 to-cyan-500',
    questionCount: Number(r.questionCount || 0),
  }))
}

export default async function CategoryGrid() {
  const categories = await fetchCategories()

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
          {categories.reduce((acc, c) => acc + (c.questionCount || 0), 0)} preguntas disponibles
        </div>
      </div>
    </div>
  )
}
