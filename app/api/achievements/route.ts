import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: Number(process.env.DB_PORT || 3306),
  })
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const profileId = url.searchParams.get('id')

    const conn = await getConnection()

    // Construir la consulta de forma segura y legible.
    const joinClause = profileId
      ? 'LEFT JOIN profile_achievements pa ON pa.achievement_id = a.id AND pa.profile_id = ?'
      : 'LEFT JOIN profile_achievements pa ON pa.achievement_id = a.id'

    const sqlParts = [
      'SELECT a.id, a.`key` AS `key`, a.title, a.description, a.icon, a.criteria, a.xp_reward, a.is_hidden,',
      'pa.unlocked_at, pa.extra',
      'FROM achievements a',
      joinClause,
      'ORDER BY a.id ASC',
    ]

    const sql = sqlParts.join(' ')
    const [rows] = await conn.execute(sql, profileId ? [profileId] : [])

    // If profileId provided, compute some handy aggregates for that user
    let userMaxScore: number | null = null
    let userMinDuration: number | null = null
    let userTotalQuizzes: number | null = null
    if (profileId) {
      try {
        const [aggRows] = await conn.execute(
          'SELECT MAX(score) as max_score, MIN(duration_seconds) as min_duration, COUNT(*) as total_quizzes FROM user_quizzes WHERE user_id = ?',
          [profileId]
        )
        const rr = Array.isArray(aggRows) ? (aggRows as any[]) : []
        if (rr.length > 0) {
          if (rr[0].max_score !== null) userMaxScore = Number(rr[0].max_score)
          if (rr[0].min_duration !== null) userMinDuration = Number(rr[0].min_duration)
          if (rr[0].total_quizzes !== null) userTotalQuizzes = Number(rr[0].total_quizzes)
        }
      } catch (e) {
        // ignore errors computing aggregates
        userMaxScore = null
        userMinDuration = null
        userTotalQuizzes = null
      }
    }

    await conn.end()

    // rows puede contener Buffer para fields JSON dependiendo de driver; convertir a JSON serializable
    const result = (rows as any[]).map((r) => {
      let criteria = null
      try {
        criteria = r.criteria ? (typeof r.criteria === 'string' ? JSON.parse(r.criteria) : r.criteria) : null
      } catch (e) {
        criteria = r.criteria
      }
      let extra = null
      try {
        extra = r.extra ? (typeof r.extra === 'string' ? JSON.parse(r.extra) : r.extra) : null
      } catch (e) {
        extra = r.extra
      }

      // If profileId was provided, try to derive helpful progress information for common criteria types
      try {
        const criteriaObj = criteria
        extra = extra || {}
        // score-based achievements: use user's best score
        if (profileId && userMaxScore !== null && typeof criteriaObj?.score === 'number' && typeof extra.progress !== 'number') {
          extra.progress = Math.min(userMaxScore, Number(criteriaObj.score))
          extra.target = Number(criteriaObj.score)
        }
        // count-based achievements: use total quizzes count
        if (profileId && userTotalQuizzes !== null && typeof criteriaObj?.count === 'number' && typeof extra.progress !== 'number') {
          extra.progress = Math.min(userTotalQuizzes, Number(criteriaObj.count))
          extra.target = Number(criteriaObj.count)
        }
        // time/duration-based achievements: smaller is better; present progress as (target - bestDuration)
        // support keys: seconds, duration_seconds, time
        const timeTarget = typeof criteriaObj?.seconds === 'number' ? Number(criteriaObj.seconds) : (typeof criteriaObj?.duration_seconds === 'number' ? Number(criteriaObj.duration_seconds) : (typeof criteriaObj?.time === 'number' ? Number(criteriaObj.time) : undefined))
        if (profileId && userMinDuration !== null && typeof timeTarget === 'number' && typeof extra.progress !== 'number') {
          // represent time-based progress as percentage (0..100) where lower durations => higher %
          const maxP = timeTarget
          const diff = Math.max(0, maxP - Number(userMinDuration))
          const pct = maxP > 0 ? Math.min(1, diff / maxP) : 0
          extra.progress = Math.round(pct * 100)
          extra.target = 100
        }
      } catch (e) {
        // ignore
      }

      return {
        id: r.id,
        key: r.key,
        title: r.title,
        description: r.description,
        icon: r.icon || null,
        criteria,
        xpReward: r.xp_reward,
        isHidden: !!r.is_hidden,
        unlocked: !!r.unlocked_at,
        unlockedAt: r.unlocked_at ? new Date(r.unlocked_at).toISOString() : null,
        extra,
      }
    })

    return NextResponse.json({ ok: true, achievements: result })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 })
  }
}
