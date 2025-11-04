import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import '../styles/Auth.css'

export default function EmployeeLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      if (user) localStorage.setItem('user', JSON.stringify(user))

      // Solo permitir roles de empleado/admin
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const json = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
        const role = json.rol || json.role
        
        // Validar que sea un rol de empleado
        if (role === 'ADMIN' || role === 'CAJERO' || role === 'COCINERO') navigate('/dashboard')
        else {
          setError('Esta cuenta no tiene permisos de empleado')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch {
        setError('Error al validar credenciales')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-image">
        <div className="auth-overlay"></div>
        <div className="auth-brand">
          <h1>PANEL DE EMPLEADOS</h1>
          <p>Acceso exclusivo para personal</p>
        </div>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <Link to="/" className="back-link">← Volver al inicio</Link>
          
          <div className="auth-header">
            <h2>Iniciar sesión - Empleado</h2>
            <p>Accede al panel de control con tu cuenta de empleado</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="empleado@pitapanpita.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Acceder al panel'}
            </button>
          </form>

          <div className="auth-footer">
            <p style={{color: '#dc3545', fontSize: '.9rem'}}>⚠️ Acceso exclusivo para personal autorizado</p>
            <p>¿No tienes cuenta? <Link to="/employee-register">Registrarte</Link></p>
            <p>¿Eres cliente? <Link to="/login">Iniciar sesión aquí</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
