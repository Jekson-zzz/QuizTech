const http = require('http')

const profileId = process.argv[2] ? Number(process.argv[2]) : (process.env.PROFILE_ID ? Number(process.env.PROFILE_ID) : 8)
const adminToken = process.env.ADMIN_TOKEN || null

const body = JSON.stringify({ profileId })

const options = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  path: '/api/admin/recheck-achievements',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}
if (adminToken) options.headers['x-admin-token'] = adminToken

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => (data += chunk))
  res.on('end', () => {
    console.log('status', res.statusCode)
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2))
    } catch (e) {
      console.log(data)
    }
  })
})

req.on('error', (e) => console.error('request error', e))
req.write(body)
req.end()
