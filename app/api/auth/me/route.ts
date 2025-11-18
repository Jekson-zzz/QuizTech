import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: Number(process.env.DB_PORT || 3306),
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const conn = await getConnection();
    // Intentamos leer también las columnas de progreso. Si no existen (migración no aplicada), hacemos fallback y devolvemos valores por defecto.
    let user: any = null
    try {
      // Intentamos leer también las columnas de progreso y agregados.
      const [rows] = await conn.execute(
        'SELECT id, name, email, level, current_xp, xp_to_next_level, streak, quizzes_completed, average_score FROM `profile_data` WHERE id = ? LIMIT 1',
        [id]
      );
      user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
    } catch (e) {
      // Probablemente las columnas no existen aún; intentamos la consulta básica
      console.warn('Fallo al leer columnas de progreso (posible migración no aplicada):', e && (e as any).message ? (e as any).message : e);
      const [rows2] = await conn.execute('SELECT id, name, email FROM `profile_data` WHERE id = ? LIMIT 1', [id]);
      user = Array.isArray(rows2) && rows2.length ? (rows2 as any)[0] : null;
      // rellenamos valores por defecto
      if (user) {
        user.level = 1
        user.current_xp = 0
        user.xp_to_next_level = 1000
        user.streak = 0
      }
    }

    if (!user) {
      await conn.end();
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Intentamos sumar el tiempo total de los quizzes del usuario (en segundos), si la tabla existe
    let totalSeconds = 0
    try {
      const [totRows] = await conn.execute('SELECT COALESCE(SUM(duration_seconds),0) as total_seconds FROM `user_quizzes` WHERE user_id = ?', [user.id])
      const tr = Array.isArray(totRows) && totRows.length ? (totRows as any)[0] : null
      totalSeconds = tr ? Number(tr.total_seconds || 0) : 0
    } catch (e) {
      // Si falla (tabla/columna no existe), ignoramos y devolvemos 0
      console.warn('No se pudo calcular tiempo total de quizzes:', e && (e as any).message ? (e as any).message : e)
      totalSeconds = 0
    }

    await conn.end();

    // Añadimos también campos agregados si existen
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        level: user.level,
        currentXP: user.current_xp,
        xpToNextLevel: user.xp_to_next_level,
        streak: user.streak,
        quizzesCompleted: user.quizzes_completed ?? null,
        averageScore: user.average_score ?? null,
        // tiempoActivo en minutos (redondeado)
        tiempoActivo: Math.round(Number(totalSeconds || 0) / 60),
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 });
  }
}
