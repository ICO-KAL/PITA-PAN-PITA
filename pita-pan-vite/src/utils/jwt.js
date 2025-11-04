export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function getAuth() {
  const token = localStorage.getItem('token')
  if (!token) return { token: null, user: null, role: null }
  const payload = parseJwt(token)
  const role = payload?.rol || payload?.role || null
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })()
  return { token, user, role, payload }
}

export function isInRole(requiredRoles) {
  const { role } = getAuth()
  if (!role) return false
  if (!requiredRoles || requiredRoles.length === 0) return true
  return requiredRoles.includes(role)
}
