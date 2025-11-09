import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your_db',
    port: Number(process.env.DB_PORT || 3306),
  });
}

export async function POST(req: Request) {
  try {
    const { userId, score, durationSeconds, category } = await req.json();
    if (!userId || typeof score !== 'number' || typeof durationSeconds !== 'number') {
      return NextResponse.json({ error: 'Faltan campos o tipos inválidos' }, { status: 400 });
    }

    const conn = await getConnection();
    try {
      // Insertar intento en user_quizzes
      await conn.execute(
        'INSERT INTO `user_quizzes` (`user_id`, `category`, `score`, `duration_seconds`) VALUES (?,?,?,?)',
        [userId, category || null, score, durationSeconds]
      );

      // Intentar actualizar agregados en profile_data (quizzes_completed, average_score)
      try {
        // Leer valores actuales (sin study_time)
        const [rows] = await conn.execute('SELECT quizzes_completed, average_score FROM `profile_data` WHERE id = ? LIMIT 1', [userId]);
        const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
        if (row) {
          const prevCount = Number(row.quizzes_completed || 0);
          const prevAvg = Number(row.average_score || 0);

          const newCount = prevCount + 1;
          const newAvg = newCount === 0 ? score : (prevAvg * prevCount + score) / newCount;

          await conn.execute('UPDATE `profile_data` SET quizzes_completed = ?, average_score = ? WHERE id = ?', [newCount, newAvg, userId]);
        }
      } catch (e) {
        // Si falla al actualizar (columnas no existen), ignoramos para evitar romper la petición
        console.warn('No se pudo actualizar agregados en profile_data (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
      }

      await conn.end();
      return NextResponse.json({ ok: true });
    } catch (e) {
      await conn.end();
      console.error('Error procesando quiz:', e);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
