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
    // Basic admin protection: if ADMIN_TOKEN is set require header
    const adminToken = process.env.ADMIN_TOKEN
    if (adminToken) {
      const provided = req.headers.get('x-admin-token') || ''
      if (!provided || provided !== adminToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    const profileId = body && body.profileId ? Number(body.profileId) : null
    if (!profileId) return NextResponse.json({ error: 'profileId required' }, { status: 400 })

    const conn = await getConnection()
    const newlyUnlocked: Array<any> = []
    try {
      const [profileRows] = await conn.execute('SELECT id, level, quizzes_completed, streak FROM `profile_data` WHERE id = ? LIMIT 1', [profileId])
      const profile = Array.isArray(profileRows) && profileRows.length ? (profileRows as any)[0] : null
      if (!profile) {
        await conn.end()
        return NextResponse.json({ error: 'profile not found' }, { status: 404 })
      }

      const [achRows] = await conn.execute('SELECT id, `key`, title, description, criteria, xp_reward FROM `achievements`')
      const achievements = Array.isArray(achRows) ? (achRows as any[]) : []

      for (const ach of achievements) {
        try {
          const [existsRows] = await conn.execute('SELECT 1 FROM `profile_achievements` WHERE profile_id = ? AND achievement_id = ? LIMIT 1', [profileId, ach.id])
          if (Array.isArray(existsRows) && existsRows.length) continue

          let criteria = null
          try { criteria = ach.criteria ? (typeof ach.criteria === 'string' ? JSON.parse(ach.criteria) : ach.criteria) : null } catch (e) { criteria = ach.criteria }

          let shouldUnlock = false
          const extra: any = {}

          if (criteria && typeof criteria === 'object') {
            const type = String(criteria.type || '').toLowerCase()
            if (type === 'complete_quiz') {
              const count = Number(criteria.count || 1)
              if (Number(profile.quizzes_completed || 0) >= count) shouldUnlock = true
            } else if (type === 'streak') {
              const days = Number(criteria.days || 0)
              const currentStreak = Number(profile.streak || 0)
              if (currentStreak === days) {
                shouldUnlock = true
                extra.progress = currentStreak
                extra.target = days
              }
            } else if (type === 'perfect_score') {
              const needed = Number(criteria.score || 100)
              try {
                const [rows] = await conn.execute('SELECT 1 FROM `user_quizzes` WHERE user_id = ? AND score >= ? LIMIT 1', [profileId, needed])
                if (Array.isArray(rows) && rows.length) shouldUnlock = true
              } catch (e) {}
            } else if (type === 'quizzes_in_day') {
              const needed = Number(criteria.count || 1)
              try {
                const [cntRows] = await conn.execute(
                  'SELECT COUNT(*) as cnt FROM `user_quizzes` WHERE user_id = ? AND DATE(created_at - INTERVAL 4 HOUR) = DATE(UTC_TIMESTAMP() - INTERVAL 4 HOUR)',
                  [profileId]
                )
                const cnt = Array.isArray(cntRows) && cntRows.length ? Number((cntRows as any)[0].cnt || 0) : 0
                if (cnt >= needed) {
                  shouldUnlock = true
                  extra.progress = cnt
                  extra.target = needed
                }
              } catch (e) {}
            } else if (type === 'reach_level') {
              const lv = Number(criteria.level || 0)
              if (Number(profile.level || 0) >= lv) shouldUnlock = true
            } else if (type === 'complete_all_quizzes' || type === 'complete_all_categories') {
              try {
                const [totalRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `categories`')
                const total = Array.isArray(totalRows) && totalRows.length ? Number((totalRows as any)[0].cnt || 0) : 0
                const neededScore = Number(criteria.score || 100)
                if (total > 0) {
                  const [cntRows] = await conn.execute(
                    `SELECT COUNT(*) as cnt FROM categories c WHERE EXISTS (
                       SELECT 1 FROM user_quizzes uq WHERE uq.user_id = ? AND uq.score >= ?
                         AND (
                           uq.category_id = c.id
                           OR uq.category COLLATE utf8mb4_unicode_ci = CAST(c.id AS CHAR) COLLATE utf8mb4_unicode_ci
                         )
                    )`,
                    [profileId, neededScore]
                  )
                  const cnt = Array.isArray(cntRows) && cntRows.length ? Number((cntRows as any)[0].cnt || 0) : 0
                  if (cnt >= total) {
                    shouldUnlock = true
                    extra.progress = cnt
                    extra.target = total
                  }
                }
              } catch (e) {}
            }
          }

          if (shouldUnlock) {
            try {
              await conn.execute('INSERT INTO `profile_achievements` (profile_id, achievement_id, unlocked_at, extra) VALUES (?,?,UTC_TIMESTAMP(),?)', [profileId, ach.id, JSON.stringify(extra || null)])
              newlyUnlocked.push({ id: ach.id, key: ach.key, title: ach.title })
            } catch (e) {
              // ignore duplicate entry errors etc.
            }
          }
        } catch (e) {
          // continue with next achievement on error
          console.warn('Error evaluating achievement', ach && ach.id, e && (e as any).message ? (e as any).message : e)
        }
      }

      await conn.end()
      return NextResponse.json({ ok: true, newlyUnlocked })
    } catch (e) {
      await conn.end()
      console.error('Error rechecking achievements:', e)
      return NextResponse.json({ error: 'internal' }, { status: 500 })
    }
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'bad request', message: err?.message || String(err) }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'POST profileId as JSON to re-evaluate achievements' })
}
