const mysql = require('mysql2/promise')

;(async () => {
  const profileId = process.argv[2] ? Number(process.argv[2]) : 8
  const cfg = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || 'mcSyjVSa20HSagsK',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  }

  const conn = await mysql.createConnection(cfg)
  try {
    console.log('Re-evaluating achievements for profile', profileId)
    const [profileRows] = await conn.execute('SELECT id, level, quizzes_completed, streak FROM `profile_data` WHERE id = ? LIMIT 1', [profileId])
    if (!Array.isArray(profileRows) || !profileRows.length) {
      console.error('Profile not found:', profileId)
      return
    }
    const profile = profileRows[0]

    const [achRows] = await conn.execute('SELECT id, `key`, title, description, criteria, xp_reward FROM `achievements`')
    const achievements = Array.isArray(achRows) ? achRows : []

    let newlyUnlocked = []

    for (const ach of achievements) {
      try {
        const [existsRows] = await conn.execute('SELECT 1 FROM `profile_achievements` WHERE profile_id = ? AND achievement_id = ? LIMIT 1', [profileId, ach.id])
        if (Array.isArray(existsRows) && existsRows.length) {
          // already unlocked
          continue
        }

        let criteria = null
        try { criteria = ach.criteria ? (typeof ach.criteria === 'string' ? JSON.parse(ach.criteria) : ach.criteria) : null } catch(e) { criteria = ach.criteria }

        let shouldUnlock = false
        const extra = {}

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
            // Check if any historic quiz has that score
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
              const cnt = Array.isArray(cntRows) && cntRows.length ? Number(cntRows[0].cnt || 0) : 0
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
              const total = Array.isArray(totalRows) && totalRows.length ? Number(totalRows[0].cnt || 0) : 0
              const neededScore = Number(criteria.score || 100)
              if (total > 0) {
                // Count how many categories have at least one user_quiz for this profile with score >= neededScore
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
                const cnt = Array.isArray(cntRows) && cntRows.length ? Number(cntRows[0].cnt || 0) : 0
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
            console.log('Unlocked achievement:', ach.key)
          } catch (e) {
            console.warn('Failed to insert achievement', ach.id, e && e.message ? e.message : e)
          }
        }
      } catch (e) {
        console.warn('Error checking achievement', ach && ach.id, e && e.message ? e.message : e)
      }
    }

    console.log('Done. Newly unlocked:', newlyUnlocked)
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e)
  } finally {
    await conn.end()
  }
})()
