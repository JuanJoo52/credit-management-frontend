import { getToken, clearSession } from './auth'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) { clearSession(); window.location.assign('/login?expired=1') }
  return { ok: res.ok, status: res.status, data }
}
