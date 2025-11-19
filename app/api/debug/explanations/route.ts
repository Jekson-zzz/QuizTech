import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function GET(req: Request) {
  const url = typeof req.url === 'string' ? new URL(req.url) : null
  const categoryParam = url ? url.searchParams.get('category') : null

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_db',
    port: Number(process.env.DB_PORT || 3306),
  })

  try {
    // Consulta base: respuestas con explicación no nula, junto a pregunta y categoría
    let sql = `
      SELECT a.id AS answer_id, a.question_id, a.text AS answer_text, a.explanation AS answer_explanation,
             q.text AS question_text, q.id AS question_id_db, s.id AS scenario_id, s.category_id, c.name AS category_name
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      LEFT JOIN scenarios s ON q.scenario_id = s.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE a.explanation IS NOT NULL AND TRIM(a.explanation) <> ''
      ORDER BY a.id DESC
      LIMIT 200
    `

    const params: any[] = []
    // Si se pasa ?category=slug_or_id filtramos
    if (categoryParam) {
      // detect numeric id
      if (/^\d+$/.test(categoryParam)) {
        sql = sql.replace('ORDER BY', 'AND s.category_id = ? ORDER BY')
        params.push(Number(categoryParam))
      } else {
        sql = sql.replace('ORDER BY', 'AND (c.slug = ? OR c.name = ?) ORDER BY')
        params.push(categoryParam, categoryParam)
      }
    }

    const [rows] = await conn.execute(sql, params)
    await conn.end()

    return NextResponse.json({ ok: true, count: Array.isArray(rows) ? (rows as any).length : 0, rows })
  } catch (e: any) {
    try {
      await conn.end()
    } catch (er) {}
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
