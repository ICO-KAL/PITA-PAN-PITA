import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import '../styles/Auth.css'

export default function Login() {
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

  // Cliente normal: redirigir al portal del cliente
  navigate('/cliente')
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
          <h1>PITA PAN PITA</h1>
          <p>Cocina tradicional con toque moderno</p>
        </div>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <Link to="/" className="back-link">← Volver al inicio</Link>
          
          <div className="auth-header">
            <h2>Iniciar sesión - Cliente</h2>
            <p>Accede para hacer pedidos y ver seguimiento</p>
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
                placeholder="tu@email.com"
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

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Recordarme</span>
              </label>
              <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="auth-footer">
            <p>¿No tienes cuenta? <Link to="/register">Crear una cuenta</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
