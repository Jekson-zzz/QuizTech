import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, score, durationSeconds, category } = body;
    // Opcionales para evitar duplicados y controlar finalización desde cliente
    const clientQuizId: string | undefined = body.clientQuizId;
    const finalSubmission: boolean = !!body.final;
    if (!userId || typeof score !== 'number' || typeof durationSeconds !== 'number') {
      return NextResponse.json({ error: 'Faltan campos o tipos inválidos' }, { status: 400 });
    }

    const conn = await getConnection();
    try {
      // Detectar si las columnas `client_quiz_id` y `finalized` existen en la tabla user_quizzes
      let insertResult: any = null;
      let hasClientQuizIdCol = false;
      let hasFinalizedCol = false;
      try {
        const [cols] = await conn.execute(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?,?)',
          [process.env.DB_NAME || 'quizz-tech-backend', 'user_quizzes', 'client_quiz_id', 'finalized']
        );
        if (Array.isArray(cols) && cols.length) {
          for (const r of cols as any[]) {
            if (r.COLUMN_NAME === 'client_quiz_id') hasClientQuizIdCol = true;
            if (r.COLUMN_NAME === 'finalized') hasFinalizedCol = true;
          }
        }
      } catch (e) {
        // Si no podemos comprobar, continuamos con las inserciones clásicas (sin columnas nuevas)
        console.warn('No se pudo comprobar columnas en INFORMATION_SCHEMA, procediendo con inserción por defecto:', e && (e as any).message ? (e as any).message : e);
      }

      if (hasClientQuizIdCol) {
        // Construir la consulta con client_quiz_id y posible finalized
        if (hasFinalizedCol) {
          const sql = `INSERT INTO \`user_quizzes\` (user_id, client_quiz_id, category, score, duration_seconds, finalized)
            VALUES (?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE category=VALUES(category), score=VALUES(score), duration_seconds=VALUES(duration_seconds), finalized = IF(VALUES(finalized)=1,1,finalized), id=LAST_INSERT_ID(id)`;
          const params = [userId, clientQuizId || null, category || null, score, durationSeconds, finalSubmission ? 1 : 0];
          const [res] = await conn.execute(sql, params);
          insertResult = res;
        } else {
          const sql = `INSERT INTO \`user_quizzes\` (user_id, client_quiz_id, category, score, duration_seconds)
            VALUES (?,?,?,?,?)
            ON DUPLICATE KEY UPDATE category=VALUES(category), score=VALUES(score), duration_seconds=VALUES(duration_seconds), id=LAST_INSERT_ID(id)`;
          const params = [userId, clientQuizId || null, category || null, score, durationSeconds];
          const [res] = await conn.execute(sql, params);
          insertResult = res;
        }
      } else {
        // No existe client_quiz_id: insertar de forma tradicional
        if (hasFinalizedCol) {
          const [res] = await conn.execute(
            'INSERT INTO `user_quizzes` (`user_id`, `category`, `score`, `duration_seconds`, `finalized`) VALUES (?,?,?,?,?)',
            [userId, category || null, score, durationSeconds, finalSubmission ? 1 : 0]
          );
          insertResult = res;
        } else {
          const [res] = await conn.execute(
            'INSERT INTO `user_quizzes` (`user_id`, `category`, `score`, `duration_seconds`) VALUES (?,?,?,?)',
            [userId, category || null, score, durationSeconds]
          );
          insertResult = res;
        }
      }

      // Si se proporcionan detalles por pregunta, persistirlos en user_answers
      const details = Array.isArray(body.details) ? body.details : null;
      let userQuizId: number | null = null;
      try {
        userQuizId = insertResult && (insertResult as any).insertId ? Number((insertResult as any).insertId) : null;
      } catch (e) {
        userQuizId = null;
      }

      if (userQuizId && details && details.length) {
        try {
          const values: any[] = []
          const placeholders: string[] = []
          for (const d of details) {
            // d: { id: questionId, selected: index|null, correct: boolean, options: [{id, text}] }
            const questionId = d.id || null
            let answerId = null
            if (Array.isArray(d.options) && typeof d.selected === 'number') {
              const opt = d.options[d.selected]
              if (opt && (opt.id !== undefined && opt.id !== null)) answerId = opt.id
            }
            const isCorrect = typeof d.correct === 'boolean' ? (d.correct ? 1 : 0) : null
            placeholders.push('(?,?,?,?)')
            values.push(userQuizId, questionId, answerId, isCorrect)
          }
          if (placeholders.length) {
            const sql = 'INSERT INTO `user_answers` (`user_quiz_id`, `question_id`, `answer_id`, `is_correct`) VALUES ' + placeholders.join(',')
            await conn.execute(sql, values)
          }
        } catch (e) {
          console.warn('No se pudieron insertar user_answers:', e && (e as any).message ? (e as any).message : e)
        }
      }

      // Intentar registrar XP ganado y actualizar level/current_xp usando la tabla `levels`.
      // Exponemos la XP calculada en la respuesta para que el frontend pueda mostrarla inmediatamente.
      // Solo otorgamos XP/level cuando la petición es la sumisión final del quiz.
      let xpEarned = 0;
      let xpMeta: any = null;
      try {
        if (!finalSubmission) {
          // No es sumisión final: no otorgamos XP ni contamos el quiz. Solo guardamos user_answers.
        } else {
          // Base XP: lineal por score
        }
        const baseXp = Math.max(0, Math.round(Number(score) * 10));

        // Determinar multiplicador: bonus por perfecto (todas correctas) o por umbrales de score
        let multiplier = 1;
        const hasDetails = Array.isArray(details) && details.length > 0;
        let allCorrect = false;
        if (hasDetails) {
          try {
            allCorrect = details.every((d: any) => d && d.correct === true);
          } catch (e) {
            allCorrect = false;
          }
        }

        if (allCorrect || Number(score) >= 100) {
          multiplier = 1.5; // bono por perfecto
        } else if (Number(score) >= 90) {
          multiplier = 1.25;
        } else if (Number(score) >= 75) {
          multiplier = 1.1;
        } else {
          multiplier = 1.0;
        }

        xpEarned = Math.max(0, Math.round(baseXp * multiplier));

        // Insertar evento de XP (guardamos meta con baseXp y multiplicador)
        xpMeta = { category: category || null, score, baseXp, multiplier, xpEarned }; 
        try {
          if (finalSubmission) {
            if (userQuizId) {
              await conn.execute(
                'INSERT INTO `profile_xp_events` (`profile_id`, `user_quiz_id`, `amount`, `source`, `meta`) VALUES (?,?,?,?,?)',
                [userId, userQuizId, xpEarned, 'quiz', JSON.stringify(xpMeta)]
              );
            } else {
              await conn.execute(
                'INSERT INTO `profile_xp_events` (`profile_id`, `amount`, `source`, `meta`) VALUES (?,?,?,?)',
                [userId, xpEarned, 'quiz', JSON.stringify(xpMeta)]
              );
            }
          }
        } catch (e) {
          console.warn('No se pudo insertar evento de XP (tabla ausente?):', e && (e as any).message ? (e as any).message : e);
        }

        // Actualizar profile_data.level y profile_data.current_xp si existen las columnas
        try {
          const [pdRows] = await conn.execute('SELECT level, current_xp FROM `profile_data` WHERE id = ? LIMIT 1', [userId]);
          const pd = Array.isArray(pdRows) && pdRows.length ? (pdRows as any)[0] : null;
          if (pd) {
            let currentLevel = Number(pd.level || 1);
            let currentXp = Number(pd.current_xp || 0) + Number(xpEarned);

            // Intentamos subir niveles tantas veces como alcance
            while (true) {
              const [lvlRows] = await conn.execute('SELECT xp_to_reach FROM `levels` WHERE level = ? LIMIT 1', [currentLevel]);
              const lvl = Array.isArray(lvlRows) && lvlRows.length ? (lvlRows as any)[0] : null;
              if (!lvl) break; // no hay definición para este nivel
              const needed = Number(lvl.xp_to_reach || 0);
              if (needed > 0 && currentXp >= needed) {
                currentXp = currentXp - needed;
                currentLevel = currentLevel + 1;
                continue;
              }
              break;
            }

            // Calcular xp_to_next_level (si existe definición)
            const [nextRows] = await conn.execute('SELECT xp_to_reach FROM `levels` WHERE level = ? LIMIT 1', [currentLevel]);
            const next = Array.isArray(nextRows) && nextRows.length ? (nextRows as any)[0] : null;
            const xpToNext = next ? Number(next.xp_to_reach || 0) : null;

            try {
              if (finalSubmission) {
                if (xpToNext !== null) {
                  await conn.execute('UPDATE `profile_data` SET level = ?, current_xp = ?, xp_to_next_level = ? WHERE id = ?', [currentLevel, currentXp, xpToNext, userId]);
                } else {
                  await conn.execute('UPDATE `profile_data` SET level = ?, current_xp = ? WHERE id = ?', [currentLevel, currentXp, userId]);
                }
              }
            } catch (e) {
              // Si las columnas no existen, no rompemos la petición
              console.warn('No se pudo actualizar level/current_xp en profile_data (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
            }
          }
        } catch (e) {
          console.warn('Error leyendo/actualizando profile_data para XP:', e && (e as any).message ? (e as any).message : e);
        }
      } catch (e) {
        console.warn('Error calculando XP ganado:', e && (e as any).message ? (e as any).message : e);
      }
      // Intentar actualizar agregados en profile_data (quizzes_completed, average_score)
      try {
        // Leer valores actuales (sin study_time)
        if (finalSubmission) {
          const [rows] = await conn.execute('SELECT quizzes_completed, average_score FROM `profile_data` WHERE id = ? LIMIT 1', [userId]);
          const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;
          if (row) {
            const prevCount = Number(row.quizzes_completed || 0);
            const prevAvg = Number(row.average_score || 0);

            const newCount = prevCount + 1;
            const newAvg = newCount === 0 ? score : (prevAvg * prevCount + score) / newCount;

            await conn.execute('UPDATE `profile_data` SET quizzes_completed = ?, average_score = ? WHERE id = ?', [newCount, newAvg, userId]);
          }
        }
      } catch (e) {
        // Si falla al actualizar (columnas no existen), ignoramos para evitar romper la petición
        console.warn('No se pudo actualizar agregados en profile_data (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
      }

      // Intentar actualizar racha (streak) y last_active.
      // Lógica: usamos fechas en UTC para una regla de "día calendario UTC" por simplicidad.
      // - Si last_active es hoy (UTC) -> no cambiar la racha
      // - Si last_active es ayer (UTC) -> incrementar racha
      // - Si last_active es más antiguo o nulo -> resetear a 1
      try {
        // Intentamos leer streak y last_active; si no existen las columnas, lanzará y lo capturamos
        const [rows2] = await conn.execute('SELECT streak, last_active FROM `profile_data` WHERE id = ? LIMIT 1', [userId]);
        const r = Array.isArray(rows2) && rows2.length ? (rows2 as any)[0] : null;
        if (r) {
            const prevStreak = Number(r.streak || 0);
            // Normalize last_active to YYYY-MM-DD regardless of driver type
            let lastActiveDateStr: string | null = null;
            if (r.last_active) {
              if (r.last_active instanceof Date) {
                lastActiveDateStr = (r.last_active as Date).toISOString().slice(0, 10);
              } else {
                const s = String(r.last_active);
                const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
                lastActiveDateStr = m ? m[1] : s;
              }
            } else {
              lastActiveDateStr = null;
            }

            // Calculamos la fecha "hoy" y "ayer" en UTC-4 como strings YYYY-MM-DD
            const toUtc4DateString = (d = new Date()) => {
              const ms = d.getTime() - 4 * 60 * 60 * 1000;
              return new Date(ms).toISOString().slice(0, 10);
            };
            const todayStr = toUtc4DateString();
            const yesterdayStr = toUtc4DateString(new Date(Date.now() - 24 * 60 * 60 * 1000));

            let newStreak = 1;
            if (lastActiveDateStr) {
              if (lastActiveDateStr === todayStr) {
                newStreak = prevStreak;
              } else if (lastActiveDateStr === yesterdayStr) {
                newStreak = prevStreak + 1;
              } else {
                newStreak = 1;
              }
            } else {
              newStreak = 1;
            }

            // Actualizamos streak y last_active a la fecha (DATE) correspondiente en UTC-4
            await conn.execute('UPDATE `profile_data` SET streak = ?, last_active = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR) WHERE id = ?', [newStreak, userId]);
        }
      } catch (e) {
        // Si las columnas no existen (migración no aplicada), ignoramos para no romper la petición
        console.warn('No se pudo actualizar streak/last_active (columnas ausentes?):', e && (e as any).message ? (e as any).message : e);
      }

      await conn.end();
      return NextResponse.json({ ok: true, xpEarned, xpMeta });
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
