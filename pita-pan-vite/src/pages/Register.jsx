import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import '../styles/Auth.css'

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { nombre, email, password })
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.')
      navigate('/login')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-image register-image">
        <div className="auth-overlay"></div>
        <div className="auth-brand">
          <h1>PITA PAN PITA</h1>
          <p>Únete a nuestra comunidad culinaria</p>
        </div>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <Link to="/" className="back-link">← Volver al inicio</Link>
          
          <div className="auth-header">
            <h2>Crear cuenta</h2>
            <p>Regístrate para empezar a realizar tus pedidos</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Juan Pérez"
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>Acepto los términos y condiciones</span>
              </label>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="auth-footer">
            <p>¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
