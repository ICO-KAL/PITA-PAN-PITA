import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import '../styles/Auth.css'

export default function EmployeeRegister(){
  const [form, setForm] = useState({ nombre: '', email: '', password: '', roleName: 'CAJERO' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setError('')
    try{
      await api.post('/auth/register-employee', form)
      alert('Cuenta de empleado creada. Ahora inicia sesión.')
      navigate('/employee-login')
    }catch(err){
      setError(err.response?.data?.message || err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-image">
        <div className="auth-overlay"></div>
        <div className="auth-brand">
          <h1>Registro de Empleado</h1>
          <p>Crear una cuenta de empleado</p>
        </div>
      </div>
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <Link to="/" className="back-link">← Volver al inicio</Link>
          <div className="auth-header">
            <h2>Crear cuenta - Empleado</h2>
            <p>Solo para roles del personal</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={submit} className="auth-form">
            <div className="form-group">
              <label>Nombre</label>
              <input value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={form.roleName} onChange={(e)=>setForm({...form, roleName:e.target.value})}>
                <option value="CAJERO">Cajero</option>
                <option value="COCINERO">Cocinero</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
          <div className="auth-footer">
            <p>¿Ya tienes cuenta? <Link to="/employee-login">Iniciar sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
