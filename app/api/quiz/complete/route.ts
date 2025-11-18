import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, score, durationSeconds, category } = body
    const clientQuizId: string | undefined = body.clientQuizId
    const finalSubmission: boolean = !!body.final

    if (!userId || typeof score !== 'number' || typeof durationSeconds !== 'number') {
      return NextResponse.json({ error: 'Faltan campos o tipos inválidos' }, { status: 400 })
    }

    const conn = await getConnection()
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
    console.log(`[${requestId}] POST /api/quiz/complete start userId=${userId} score=${score} duration=${durationSeconds} details=${Array.isArray(body.details) ? body.details.length : 0}`)
    let newAchievements: Array<any> = []
    let insertedUserAnswers = 0
    let insertedUserQuizId: number | null = null
    try {
      // 1) Insert/Upsert user_quizzes (so we have an id)
      let insertResult: any = null
      let hasClientQuizIdCol = false
      let hasFinalizedCol = false
      let hasCategoryIdCol = false
      try {
        const [cols] = await conn.execute(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?,?,?)',
          [process.env.DB_NAME || 'quizz-tech-backend', 'user_quizzes', 'client_quiz_id', 'finalized', 'category_id']
        )
        if (Array.isArray(cols) && cols.length) {
          for (const r of cols as any[]) {
            if (r.COLUMN_NAME === 'client_quiz_id') hasClientQuizIdCol = true
            if (r.COLUMN_NAME === 'finalized') hasFinalizedCol = true
            if (r.COLUMN_NAME === 'category_id') hasCategoryIdCol = true
          }
        }
      } catch (e) {
        console.warn('No se pudo comprobar columnas en INFORMATION_SCHEMA, procediendo con inserción por defecto:', e && (e as any).message ? (e as any).message : e)
      }
      
      // Resolver category -> category_id cuando sea posible (si el cliente envía un id o el nombre de la categoría)
      let resolvedCategoryId: number | null = null
      try {
        if (category !== undefined && category !== null) {
          const maybeId = typeof category === 'number' ? Number(category) : (typeof category === 'string' && /^\d+$/.test(category) ? Number(category) : null)
          if (maybeId) {
            try {
              const [catRows] = await conn.execute('SELECT id FROM `categories` WHERE id = ? LIMIT 1', [maybeId])
              if (Array.isArray(catRows) && catRows.length) resolvedCategoryId = Number((catRows as any)[0].id)
            } catch (e) {
              // ignore
            }
          }

          if (!resolvedCategoryId && typeof category === 'string') {
            try {
              const [catRows2] = await conn.execute('SELECT id FROM `categories` WHERE name = ? LIMIT 1', [category])
              if (Array.isArray(catRows2) && catRows2.length) resolvedCategoryId = Number((catRows2 as any)[0].id)
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (e) {
        resolvedCategoryId = null
      }

      if (hasClientQuizIdCol) {
        if (hasFinalizedCol) {
          if (finalSubmission) {
            // For final submissions, always INSERT a new row so total_attempts increases.
            // Use NULL for client_quiz_id to avoid triggering unique-key upsert.
            if (hasCategoryIdCol) {
              const [res] = await conn.execute(
                'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category_id, category, score, duration_seconds, finalized) VALUES (?,?,?,?,?,?,?)',
                [userId, null, resolvedCategoryId, category || null, score, durationSeconds, 1]
              )
              insertResult = res
            } else {
              const [res] = await conn.execute(
                'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category, score, duration_seconds, finalized) VALUES (?,?,?,?,?,?)',
                [userId, null, category || null, score, durationSeconds, 1]
              )
              insertResult = res
            }
          } else {
            let sql = ''
            let params: any[] = []
            if (hasCategoryIdCol) {
              sql = 'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category_id, category, score, duration_seconds, finalized) VALUES (?,?,?,?,?,?,?) '
                + 'ON DUPLICATE KEY UPDATE category_id=VALUES(category_id), category=VALUES(category), score=VALUES(score), duration_seconds=VALUES(duration_seconds), finalized = IF(VALUES(finalized)=1,1,finalized), id=LAST_INSERT_ID(id)'
              params = [userId, clientQuizId || null, resolvedCategoryId, category || null, score, durationSeconds, finalSubmission ? 1 : 0]
            } else {
              sql = 'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category, score, duration_seconds, finalized) VALUES (?,?,?,?,?,?) '
                + 'ON DUPLICATE KEY UPDATE category=VALUES(category), score=VALUES(score), duration_seconds=VALUES(duration_seconds), finalized = IF(VALUES(finalized)=1,1,finalized), id=LAST_INSERT_ID(id)'
              params = [userId, clientQuizId || null, category || null, score, durationSeconds, finalSubmission ? 1 : 0]
            }
            const [res] = await conn.execute(sql, params)
            insertResult = res
          }
        } else {
          if (finalSubmission) {
            if (hasCategoryIdCol) {
              const [res] = await conn.execute(
                'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category_id, category, score, duration_seconds) VALUES (?,?,?,?,?,?)',
                [userId, null, resolvedCategoryId, category || null, score, durationSeconds]
              )
              insertResult = res
            } else {
              const [res] = await conn.execute(
                'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category, score, duration_seconds) VALUES (?,?,?,?,?)',
                [userId, null, category || null, score, durationSeconds]
              )
              insertResult = res
            }
          } else {
            if (hasCategoryIdCol) {
              const sql = 'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category_id, category, score, duration_seconds) VALUES (?,?,?,?,?,?) '
                + 'ON DUPLICATE KEY UPDATE category_id=VALUES(category_id), category=VALUES(category), score=VALUES(score), duration_seconds=VALUES(duration_seconds), id=LAST_INSERT_ID(id)'
              const params = [userId, clientQuizId || null, resolvedCategoryId, category || null, score, durationSeconds]
              const [res] = await conn.execute(sql, params)
              insertResult = res
            } else {
              const sql = 'INSERT INTO `user_quizzes` (user_id, client_quiz_id, category, score, duration_seconds) VALUES (?,?,?,?,?) '
                + 'ON DUPLICATE KEY UPDATE category=VALUES(category), score=VALUES(score), duration_seconds=VALUES(duration_seconds), id=LAST_INSERT_ID(id)'
              const params = [userId, clientQuizId || null, category || null, score, durationSeconds]
              const [res] = await conn.execute(sql, params)
              insertResult = res
            }
          }
        }
      } else {
        if (hasFinalizedCol) {
          const [res] = await conn.execute(
            'INSERT INTO `user_quizzes` (`user_id`, `category`, `score`, `duration_seconds`, `finalized`) VALUES (?,?,?,?,?)',
            [userId, category || null, score, durationSeconds, finalSubmission ? 1 : 0]
          )
          insertResult = res
        } else {
          const [res] = await conn.execute(
            'INSERT INTO `user_quizzes` (`user_id`, `category`, `score`, `duration_seconds`) VALUES (?,?,?,?)',
            [userId, category || null, score, durationSeconds]
          )
          insertResult = res
        }
      }

      // 2) Persistir detalles (user_answers) si vienen
      const details = Array.isArray(body.details) ? body.details : null
      let userQuizId: number | null = null
      console.log(`[${requestId}] insertResult insertId=${(insertResult && (insertResult as any).insertId) || 0} affectedRows=${(insertResult && (insertResult as any).affectedRows) || 0}`)
      try {
        userQuizId = insertResult && (insertResult as any).insertId ? Number((insertResult as any).insertId) : null
      } catch (e) {
        userQuizId = null
      }
      insertedUserQuizId = userQuizId

      if (userQuizId && details && details.length) {
        try {
          const values: any[] = []
          const placeholders: string[] = []
          const questionIds: Array<number|null> = []
          for (const d of details) {
            const questionId = d.id || null
            let answerId = null
            if (Array.isArray(d.options) && typeof d.selected === 'number') {
              const opt = d.options[d.selected]
              if (opt && (opt.id !== undefined && opt.id !== null)) answerId = opt.id
            }
            const isCorrect = typeof d.correct === 'boolean' ? (d.correct ? 1 : 0) : null
            placeholders.push('(?,?,?,?)')
            values.push(userQuizId, questionId, answerId, isCorrect)
            questionIds.push(questionId)
          }

          // Evitar duplicados: comprobar qué question_id ya existen para este user_quiz_id
          const filteredQuestionIds = questionIds.filter((qid) => qid !== null) as number[]
          let toInsertMask: boolean[] = questionIds.map(() => true)
          if (filteredQuestionIds.length) {
            try {
              // Construir placeholders para IN (...) y parámetros
              const inPlaceholders = filteredQuestionIds.map(() => '?').join(',')
              const [existingRows] = await conn.execute(
                `SELECT question_id FROM \`user_answers\` WHERE user_quiz_id = ? AND question_id IN (${inPlaceholders})`,
                [userQuizId, ...filteredQuestionIds]
              )
              const existingSet = new Set<number>((existingRows as any[]).map((r) => Number(r.question_id)))
              // Marcar como false las posiciones que ya existen
              for (let i = 0; i < questionIds.length; i++) {
                const qid = questionIds[i]
                if (qid !== null && existingSet.has(Number(qid))) toInsertMask[i] = false
              }
            } catch (e) {
              // Si falla la comprobación, no bloqueamos la inserción (fall back to insert all)
              console.warn('No se pudo comprobar duplicados en user_answers:', e && (e as any).message ? (e as any).message : e)
            }
          }

          // Reconstruir placeholders/values solo para las respuestas nuevas
          const finalPlaceholders: string[] = []
          const finalValues: any[] = []
          for (let i = 0, vi = 0; i < questionIds.length; i++) {
            if (!toInsertMask[i]) {
              vi += 4
              continue
            }
            finalPlaceholders.push('(?,?,?,?)')
            // cada elemento ocupa 4 valores en `values`
            const start = i * 4
            finalValues.push(values[start], values[start + 1], values[start + 2], values[start + 3])
          }

          if (finalPlaceholders.length) {
            const sql = 'INSERT INTO `user_answers` (`user_quiz_id`, `question_id`, `answer_id`, `is_correct`) VALUES ' + finalPlaceholders.join(',')
            try {
              console.log(`[${requestId}] About to insert user_answers for user_quiz_id=${userQuizId}, rows=${finalPlaceholders.length}, valuesLen=${finalValues.length}`)
              const [res] = await conn.execute(sql, finalValues)
              const affected = res && (res as any).affectedRows ? Number((res as any).affectedRows) : 0
              insertedUserAnswers = affected
              console.log(`[${requestId}] Inserted user_answers affectedRows=${affected}`)
            } catch (insErr) {
              console.warn(`[${requestId}] Error inserting user_answers:`, insErr && (insErr as any).message ? (insErr as any).message : insErr)
            }
          }
        } catch (e) {
          console.warn('No se pudieron insertar user_answers:', e && (e as any).message ? (e as any).message : e)
        }
      }

      // 3) Calcular y registrar XP (solo si finalSubmission)
      let xpEarned = 0
      let xpMeta: any = null
      try {
        const baseXp = Math.max(0, Math.round(Number(score) * 10))
        let multiplier = 1
        const hasDetails = Array.isArray(details) && details.length > 0
        let allCorrect = false
        if (hasDetails) {
          // Try to resolve a numeric category_id from the provided `category` value
          let resolvedCategoryId: number | null = null
          try {
            if (category !== undefined && category !== null) {
              // if it's numeric (number or numeric-string) try to find category by id
              const maybeId = typeof category === 'number' ? Number(category) : (typeof category === 'string' && /^\d+$/.test(category) ? Number(category) : null)
              if (maybeId) {
                try {
                  const [catRows] = await conn.execute('SELECT id FROM `categories` WHERE id = ? LIMIT 1', [maybeId])
                  if (Array.isArray(catRows) && catRows.length) resolvedCategoryId = Number((catRows as any)[0].id)
                } catch (e) {
                  // ignore
                }
              }

              // if not resolved yet and category is a string, try match by name
              if (!resolvedCategoryId && typeof category === 'string') {
                try {
                  const [catRows2] = await conn.execute('SELECT id FROM `categories` WHERE name = ? LIMIT 1', [category])
                  if (Array.isArray(catRows2) && catRows2.length) resolvedCategoryId = Number((catRows2 as any)[0].id)
                } catch (e) {
                  // ignore
                }
              }
            }
          } catch (e) {
            resolvedCategoryId = null
          }

          try {
            allCorrect = details.every((d: any) => d && d.correct === true)
          } catch (e) {
            allCorrect = false
          }
        }

        if (allCorrect || Number(score) >= 100) {
          multiplier = 1.5
        } else if (Number(score) >= 90) {
          multiplier = 1.25
        } else if (Number(score) >= 75) {
          multiplier = 1.1
        } else {
          multiplier = 1.0
        }

        xpEarned = Math.max(0, Math.round(baseXp * multiplier))
        xpMeta = { category: category || null, score, baseXp, multiplier, xpEarned }

        try {
          if (finalSubmission) {
            if (userQuizId) {
              await conn.execute(
                'INSERT INTO `profile_xp_events` (`profile_id`, `user_quiz_id`, `amount`, `source`, `meta`) VALUES (?,?,?,?,?)',
                [userId, userQuizId, xpEarned, 'quiz', JSON.stringify(xpMeta)]
              )
            } else {
              await conn.execute(
                'INSERT INTO `profile_xp_events` (`profile_id`, `amount`, `source`, `meta`) VALUES (?,?,?,?)',
                [userId, xpEarned, 'quiz', JSON.stringify(xpMeta)]
              )
            }
          }
        } catch (e) {
          console.warn('No se pudo insertar evento de XP (tabla ausente?):', e && (e as any).message ? (e as any).message : e)
        }

        // Actualizar level/current_xp si existen
        try {
          const [pdRows] = await conn.execute('SELECT level, current_xp FROM `profile_data` WHERE id = ? LIMIT 1', [userId])
          const pd = Array.isArray(pdRows) && pdRows.length ? (pdRows as any)[0] : null
          if (pd) {
            let currentLevel = Number(pd.level || 1)
            let currentXp = Number(pd.current_xp || 0) + Number(xpEarned)
            while (true) {
              const [lvlRows] = await conn.execute('SELECT xp_to_reach FROM `levels` WHERE level = ? LIMIT 1', [currentLevel])
              const lvl = Array.isArray(lvlRows) && lvlRows.length ? (lvlRows as any)[0] : null
              if (!lvl) break
              const needed = Number(lvl.xp_to_reach || 0)
              if (needed > 0 && currentXp >= needed) {
                currentXp = currentXp - needed
                currentLevel = currentLevel + 1
                continue
              }
              break
            }

            const [nextRows] = await conn.execute('SELECT xp_to_reach FROM `levels` WHERE level = ? LIMIT 1', [currentLevel])
            const next = Array.isArray(nextRows) && nextRows.length ? (nextRows as any)[0] : null
            const xpToNext = next ? Number(next.xp_to_reach || 0) : null

            try {
              if (finalSubmission) {
                if (xpToNext !== null) {
                  await conn.execute('UPDATE `profile_data` SET level = ?, current_xp = ?, xp_to_next_level = ? WHERE id = ?', [currentLevel, currentXp, xpToNext, userId])
                } else {
                  await conn.execute('UPDATE `profile_data` SET level = ?, current_xp = ? WHERE id = ?', [currentLevel, currentXp, userId])
                }
              }
            } catch (e) {
              console.warn('No se pudo actualizar level/current_xp en profile_data (columnas ausentes?):', e && (e as any).message ? (e as any).message : e)
            }
          }
        } catch (e) {
          console.warn('Error leyendo/actualizando profile_data para XP:', e && (e as any).message ? (e as any).message : e)
        }
      } catch (e) {
        console.warn('Error calculando XP ganado:', e && (e as any).message ? (e as any).message : e)
      }

      // 4) Actualizar agregados en profile_data (quizzes_completed, average_score)
      try {
        if (finalSubmission) {
          const [rows] = await conn.execute('SELECT quizzes_completed, average_score FROM `profile_data` WHERE id = ? LIMIT 1', [userId])
          const row = Array.isArray(rows) && rows.length ? (rows as any)[0] : null
          if (row) {
            const prevCount = Number(row.quizzes_completed || 0)
            const prevAvg = Number(row.average_score || 0)
            const newCount = prevCount + 1
            const newAvg = newCount === 0 ? score : (prevAvg * prevCount + score) / newCount
            await conn.execute('UPDATE `profile_data` SET quizzes_completed = ?, average_score = ? WHERE id = ?', [newCount, newAvg, userId])
          }
        }
      } catch (e) {
        console.warn('No se pudo actualizar agregados en profile_data (columnas ausentes?):', e && (e as any).message ? (e as any).message : e)
      }

      // 5) Actualizar racha (streak) y last_active (UTC-4 rule)
      try {
        const [rows2] = await conn.execute('SELECT streak, last_active FROM `profile_data` WHERE id = ? LIMIT 1', [userId])
        const r = Array.isArray(rows2) && rows2.length ? (rows2 as any)[0] : null
        if (r) {
          const prevStreak = Number(r.streak || 0)
          let lastActiveDateStr: string | null = null
          if (r.last_active) {
            if (r.last_active instanceof Date) lastActiveDateStr = (r.last_active as Date).toISOString().slice(0, 10)
            else {
              const s = String(r.last_active)
              const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
              lastActiveDateStr = m ? m[1] : s
            }
          }

          const toUtc4DateString = (d = new Date()) => {
            const ms = d.getTime() - 4 * 60 * 60 * 1000
            return new Date(ms).toISOString().slice(0, 10)
          }
          const todayStr = toUtc4DateString()
          const yesterdayStr = toUtc4DateString(new Date(Date.now() - 24 * 60 * 60 * 1000))
          let newStreak = 1
          if (lastActiveDateStr) {
            if (lastActiveDateStr === todayStr) newStreak = prevStreak
            else if (lastActiveDateStr === yesterdayStr) newStreak = prevStreak + 1
            else newStreak = 1
          } else {
            newStreak = 1
          }

          await conn.execute('UPDATE `profile_data` SET streak = ?, last_active = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR) WHERE id = ?', [newStreak, userId])
        }
      } catch (e) {
        console.warn('No se pudo actualizar streak/last_active (columnas ausentes?):', e && (e as any).message ? (e as any).message : e)
      }

      // 6) Lógica de logros: evaluar criterios y otorgar nuevos logros si aplica
      try {
        // Obtener estado actualizado del perfil
        const [profileRows] = await conn.execute('SELECT id, level, quizzes_completed, streak FROM `profile_data` WHERE id = ? LIMIT 1', [userId])
        const profile = Array.isArray(profileRows) && profileRows.length ? (profileRows as any)[0] : null

        const [achRows] = await conn.execute('SELECT id, `key`, title, description, criteria, xp_reward FROM `achievements`')
        const achievementsList = Array.isArray(achRows) ? (achRows as any[]) : []

        try {
          await conn.beginTransaction()
        } catch (txErr) {
          // ignore if driver doesn't support
        }

        for (const ach of achievementsList) {
          try {
            const [existsRows] = await conn.execute('SELECT 1 FROM `profile_achievements` WHERE profile_id = ? AND achievement_id = ? LIMIT 1', [userId, ach.id])
            const exists = Array.isArray(existsRows) && existsRows.length
            if (exists) continue

            let criteria = null
            try {
              criteria = ach.criteria ? (typeof ach.criteria === 'string' ? JSON.parse(ach.criteria) : ach.criteria) : null
            } catch (e) {
              criteria = ach.criteria
            }

            let shouldUnlock = false
            const extra: any = {}

            if (criteria && typeof criteria === 'object') {
              const type = String(criteria.type || '').toLowerCase()
              if (type === 'complete_quiz') {
                const count = Number(criteria.count || 1)
                if (profile && Number(profile.quizzes_completed || 0) >= count) shouldUnlock = true
              } else if (type === 'streak') {
                const days = Number(criteria.days || 0)
                const currentStreak = profile ? Number(profile.streak || 0) : 0
                // Unlock when the stored streak reaches the target days (exact match)
                if (profile && currentStreak === days) {
                  shouldUnlock = true
                  extra.progress = currentStreak
                  extra.target = days
                  console.log(`[${requestId}] Achievement streak check: profileId=${userId} streak=${currentStreak} target=${days} -> will unlock`)
                } else {
                  console.log(`[${requestId}] Achievement streak check: profileId=${userId} streak=${currentStreak} target=${days} -> not unlocking`)
                }
              } else if (type === 'perfect_score') {
                const needed = Number(criteria.score || 100)
                // consider current attempt
                if ((Array.isArray(details) && details.every((d: any) => d && d.correct === true)) || Number(score || 0) >= needed) shouldUnlock = true
              } else if (type === 'quizzes_in_day') {
                const needed = Number(criteria.count || 1)
                try {
                  const [cntRows] = await conn.execute(
                    'SELECT COUNT(*) as cnt FROM `user_quizzes` WHERE user_id = ? AND DATE(created_at - INTERVAL 4 HOUR) = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR)',
                    [userId]
                  )
                  const cnt = Array.isArray(cntRows) && cntRows.length ? Number((cntRows as any)[0].cnt || 0) : 0
                  if (cnt >= needed) {
                    shouldUnlock = true
                    extra.progress = cnt
                    extra.target = needed
                  }
                } catch (e) {
                  // ignore
                }
              } else if (type === 'reach_level') {
                const lv = Number(criteria.level || 0)
                if (profile && Number(profile.level || 0) >= lv) shouldUnlock = true
              } else if (type === 'complete_all_quizzes') {
                try {
                  const [totalRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `categories`')
                  const total = Array.isArray(totalRows) && totalRows.length ? Number((totalRows as any)[0].cnt || 0) : 0
                  const neededScore = Number(criteria.score || 100)
                  if (total > 0 && profile) {
                    const [cntRows] = await conn.execute(
                      `SELECT COUNT(*) as cnt FROM categories c WHERE EXISTS (
                         SELECT 1 FROM user_quizzes uq WHERE uq.user_id = ? AND uq.score >= ?
                           AND (
                             uq.category_id = c.id
                             OR uq.category COLLATE utf8mb4_unicode_ci = CAST(c.id AS CHAR) COLLATE utf8mb4_unicode_ci
                           )
                      )`,
                      [userId, neededScore]
                    )
                    const cnt = Array.isArray(cntRows) && cntRows.length ? Number((cntRows as any)[0].cnt || 0) : 0
                    if (cnt >= total) {
                      shouldUnlock = true
                      extra.progress = cnt
                      extra.target = total
                    }
                  }
                } catch (e) {
                  // ignore
                }
              }
            }

            if (shouldUnlock) {
              try {
                await conn.execute('INSERT INTO `profile_achievements` (profile_id, achievement_id, unlocked_at, extra) VALUES (?,?,UTC_TIMESTAMP(),?)', [userId, ach.id, JSON.stringify(extra || null)])
                newAchievements.push({ id: ach.id, key: ach.key, title: ach.title, description: ach.description, xpReward: ach.xp_reward })
              } catch (insertErr) {
                console.warn('No se pudo insertar profile_achievement para', ach.id, insertErr && (insertErr as any).message ? (insertErr as any).message : insertErr)
              }
            }
          } catch (inner) {
            console.warn('Error evaluando logro', ach && ach.id, inner && (inner as any).message ? (inner as any).message : inner)
            continue
          }
        }

        try {
          await conn.commit()
        } catch (cErr) {
          // ignore
        }
      } catch (achErr) {
        console.warn('Error procesando logros:', achErr && (achErr as any).message ? (achErr as any).message : achErr)
      }

      await conn.end()
      return NextResponse.json({ ok: true, xpEarned, xpMeta, newAchievements, insertedUserAnswers, insertedUserQuizId })
    } catch (e) {
      await conn.end()
      console.error('Error procesando quiz:', e)
      return NextResponse.json({ error: 'Error interno', message: String(e) }, { status: 500 })
    }
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 })
  }
}

