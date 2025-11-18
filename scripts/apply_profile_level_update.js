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
    console.log('Applying update (no backup) for profileId =', profileId)
    const [sumRows] = await conn.execute('SELECT COALESCE(SUM(amount),0) as total_xp FROM profile_xp_events WHERE profile_id = ?', [profileId])
    const totalXp = Array.isArray(sumRows) && sumRows.length ? Number(sumRows[0].total_xp || 0) : 0
    const [levelsRows] = await conn.execute('SELECT level, xp_to_reach FROM levels ORDER BY level ASC')
    const levels = Array.isArray(levelsRows) ? levelsRows.map(r => ({ level: Number(r.level), xp_to_reach: Number(r.xp_to_reach) })) : []

    let rem = totalXp
    let expectedLevel = 1
    while (true) {
      const lvl = levels.find(l => l.level === expectedLevel)
      if (!lvl) break
      const need = Number(lvl.xp_to_reach || 0)
      if (need <= 0) break
      if (rem >= need) { rem -= need; expectedLevel += 1; continue }
      break
    }
    const expectedCurrentXp = rem
    const nextLvlRow = levels.find(l => l.level === expectedLevel)
    const expectedXpToNext = nextLvlRow ? Number(nextLvlRow.xp_to_reach || 0) : null

    console.log('Computed update -> level:', expectedLevel, 'current_xp:', expectedCurrentXp, 'xp_to_next_level:', expectedXpToNext)

    const updateParams = [expectedLevel, expectedCurrentXp]
    let updateSql = ''
    if (expectedXpToNext !== null) {
      updateSql = 'UPDATE profile_data SET level = ?, current_xp = ?, xp_to_next_level = ? WHERE id = ?'
      updateParams.push(expectedXpToNext, profileId)
    } else {
      updateSql = 'UPDATE profile_data SET level = ?, current_xp = ? WHERE id = ?'
      updateParams.push(profileId)
    }

    const [res] = await conn.execute(updateSql, updateParams)
    console.log('Update result:', res)
    console.log('Done. You may re-run verify script to confirm.')
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e)
  } finally {
    await conn.end()
  }
})()
