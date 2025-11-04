import { Navigate } from 'react-router-dom'
import { getAuth, isInRole } from '../utils/jwt'

export default function RoleRoute({ roles = [], children }) {
  const { token } = getAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!isInRole(roles)) return <Navigate to="/" replace />
  return children
}
