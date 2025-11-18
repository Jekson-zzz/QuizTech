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
    console.log('Verifying profile XP/level for profileId =', profileId)
    const [pdRows] = await conn.execute('SELECT id, level, current_xp, xp_to_next_level FROM profile_data WHERE id = ? LIMIT 1', [profileId])
    const pd = Array.isArray(pdRows) && pdRows.length ? (pdRows)[0] : null
    if (!pd) {
      console.error('Profile not found:', profileId)
      return
    }

    const [sumRows] = await conn.execute('SELECT COALESCE(SUM(amount),0) as total_xp FROM profile_xp_events WHERE profile_id = ?', [profileId])
    const totalXp = Array.isArray(sumRows) && sumRows.length ? Number(sumRows[0].total_xp || 0) : 0

    const [levelsRows] = await conn.execute('SELECT level, xp_to_reach FROM levels ORDER BY level ASC')
    const levels = Array.isArray(levelsRows) ? levelsRows.map(r => ({ level: Number(r.level), xp_to_reach: Number(r.xp_to_reach) })) : []

    console.log('profile_data:', pd)
    console.log('total XP from profile_xp_events:', totalXp)
    console.log('levels count:', levels.length)

    // Compute expected level starting from level 1 using totalXp
    let rem = totalXp
    let expectedLevel = 1
    let i = 0
    while (true) {
      const lvl = levels.find(l => l.level === expectedLevel)
      if (!lvl) break
      const need = Number(lvl.xp_to_reach || 0)
      if (need <= 0) break
      if (rem >= need) {
        rem -= need
        expectedLevel += 1
        continue
      }
      break
    }

    const expectedCurrentXp = rem
    // xp to next is xp_to_reach for expectedLevel
    const nextLvlRow = levels.find(l => l.level === expectedLevel)
    const expectedXpToNext = nextLvlRow ? Number(nextLvlRow.xp_to_reach || 0) : null

    console.log('Computed expectedLevel =', expectedLevel)
    console.log('Computed expectedCurrentXp =', expectedCurrentXp)
    console.log('Computed expectedXpToNext =', expectedXpToNext)

    // Compare with DB
    const dbLevel = Number(pd.level || 0)
    const dbCurrentXp = Number(pd.current_xp || 0)
    const dbXpToNext = pd.xp_to_next_level === null ? null : Number(pd.xp_to_next_level)

    console.log('\nDatabase values:')
    console.log('level:', dbLevel)
    console.log('current_xp:', dbCurrentXp)
    console.log('xp_to_next_level:', dbXpToNext)

    if (dbLevel === expectedLevel && dbCurrentXp === expectedCurrentXp) {
      console.log('\nStatus: profile_data is consistent. No update needed.')
    } else {
      console.log('\nStatus: INCONSISTENT. profile_data should be updated to expected values.')
      console.log('To update run:')
      console.log(`UPDATE profile_data SET level = ${expectedLevel}, current_xp = ${expectedCurrentXp}${expectedXpToNext !== null ? `, xp_to_next_level = ${expectedXpToNext}` : ''} WHERE id = ${profileId};`)
    }

  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e)
  } finally {
    await conn.end()
  }
})()
