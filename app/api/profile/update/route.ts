import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'quizz_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quizz-tech-backend',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body?.userId
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : undefined
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : undefined

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const conn = await getConnection()

    // Fetch existing user
    const [rows] = await conn.execute('SELECT id, password FROM `profile_data` WHERE id = ? LIMIT 1', [userId])
    const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null
    if (!user) {
      await conn.end()
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // If password change requested, validate currentPassword and set new hash
    if (newPassword !== undefined) {
      if (!currentPassword) {
        await conn.end()
        return NextResponse.json({ error: 'Se requiere la contraseña actual para cambiar la contraseña' }, { status: 400 })
      }

      // verify current password
      const parts = (user.password || '').split(':')
      if (parts.length !== 2) {
        await conn.end()
        return NextResponse.json({ error: 'Formato de contraseña en servidor inválido' }, { status: 500 })
      }
      const [salt, key] = parts
      const derived = scryptSync(currentPassword, salt, 64).toString('hex')
      const keyBuf = Buffer.from(key, 'hex')
      const derivedBuf = Buffer.from(derived, 'hex')
      if (keyBuf.length !== derivedBuf.length || !timingSafeEqual(keyBuf, derivedBuf)) {
        await conn.end()
        return NextResponse.json({ error: 'Contraseña actual inválida' }, { status: 401 })
      }

      // create new salt:key
      const newSalt = randomBytes(16).toString('hex')
      const newKey = scryptSync(newPassword, newSalt, 64).toString('hex')
      const newHash = `${newSalt}:${newKey}`

      try {
        await conn.execute('UPDATE `profile_data` SET password = ? WHERE id = ?', [newHash, userId])
      } catch (e) {
        await conn.end()
        return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 500 })
      }
    }

    // Update name if provided
    if (name !== undefined) {
      try {
        await conn.execute('UPDATE `profile_data` SET name = ? WHERE id = ?', [name, userId])
      } catch (e) {
        await conn.end()
        return NextResponse.json({ error: 'No se pudo actualizar el nombre' }, { status: 500 })
      }
    }

    await conn.end()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error in profile update:', err)
    return NextResponse.json({ error: 'Error del servidor', message: err?.message || String(err) }, { status: 500 })
  }
}
