import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Accept a flexible context type to satisfy Next's varying typings across versions
export async function GET(req: Request, context: any) {
  // In some Next versions `context.params` may be a Promise; handle both cases
  const params = context?.params && typeof context.params.then === 'function' ? await context.params : context?.params
  const rawCategory = params?.category

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_db',
    port: Number(process.env.DB_PORT || 3306),
  })

  try {
    // Determinar si 'category' es id numérico o slug/name
    let categoryRow: any = null
    if (/^\d+$/.test(rawCategory)) {
      const [rows] = await conn.execute('SELECT id, name, description FROM categories WHERE id = ? LIMIT 1', [Number(rawCategory)])
      categoryRow = Array.isArray(rows) && (rows as any).length ? (rows as any)[0] : null
    } else {
      const [rows] = await conn.execute('SELECT id, name, description FROM categories WHERE slug = ? OR name = ? LIMIT 1', [rawCategory, rawCategory])
      categoryRow = Array.isArray(rows) && (rows as any).length ? (rows as any)[0] : null
    }

    if (!categoryRow) {
      await conn.end()
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const categoryId = categoryRow.id

    // Obtener preguntas y respuestas asociadas a la categoría
    // The questions table uses `text` and `difficulty`; older columns like `type`, `order`, `points`
    // may not exist depending on migration state. Select available columns and map defaults below.
    const [qrows] = await conn.execute(
      'SELECT q.id AS question_id, q.text AS question_text, q.difficulty AS question_difficulty, ' +
  'a.id AS answer_id, a.text AS answer_text, a.is_correct ' +
      'FROM questions q ' +
      'JOIN scenarios s ON q.scenario_id = s.id ' +
      'LEFT JOIN answers a ON a.question_id = q.id ' +
      'WHERE s.category_id = ? ' +
  'ORDER BY q.id, a.id ASC',
      [categoryId]
    )

    const rowsArray = Array.isArray(qrows) ? (qrows as any[]) : []

    // Agrupar por pregunta
    const map = new Map<number, any>()
    for (const r of rowsArray) {
      const qid = Number(r.question_id)
      if (!map.has(qid)) {
        map.set(qid, {
          id: qid,
          question: r.question_text,
          // mapping: the schema has `difficulty`, but frontend expects a `type` field.
          // Provide a sensible default and keep difficulty available if needed.
          type: 'single',
          difficulty: r.question_difficulty || 'medio',
          order: 0,
          points: 1,
          options: [] as Array<{ id: number; text: string; is_correct: number }>,
        })
      }
      if (r.answer_id) {
        map.get(qid).options.push({ id: r.answer_id, text: r.answer_text, is_correct: Number(r.is_correct || 0) })
      }
    }

    const questions = Array.from(map.values())

    await conn.end()

    return NextResponse.json({ category: { id: categoryRow.id, name: categoryRow.name }, questions })
  } catch (e: any) {
    try {
      await conn.end()
    } catch (er) {}
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
