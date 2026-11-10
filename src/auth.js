// El token vive en sessionStorage: se borra al cerrar la pestaña.
const K = 'token', U = 'user'
export const getToken = () => sessionStorage.getItem(K)
export const getUser = () => { try { return JSON.parse(sessionStorage.getItem(U)) } catch { return null } }
export const setSession = (t, u) => { sessionStorage.setItem(K, t); sessionStorage.setItem(U, JSON.stringify(u)) }
export const clearSession = () => { sessionStorage.removeItem(K); sessionStorage.removeItem(U) }
export function tokenExp(t) {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp || null } catch { return null }
}
export const isLoggedIn = () => { const e = tokenExp(getToken()); return !!e && e * 1000 > Date.now() }
