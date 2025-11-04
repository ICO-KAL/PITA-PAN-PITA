import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import '../styles/Navbar.css'
import { getAuth } from '../utils/jwt'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [{ token, role }, setAuth] = useState({ token: null, role: null })

  useEffect(() => {
    const { token, role } = getAuth()
    setAuth({ token, role })
    // ping de actividad cada 60s para mostrar online/offline en dashboard admin
    let t
    if (token) {
      const ping = () => fetch((import.meta.env.VITE_API_URL || 'http://localhost:3009/api') + '/users/ping', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` } }).catch(()=>{})
      ping()
      t = setInterval(ping, 60000)
    }
    return () => t && clearInterval(t)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span>PITA PAN PITA</span>
        </Link>

        <button className="nav-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setIsOpen(false)}>Inicio</Link></li>
          <li><Link to="/menu" onClick={() => setIsOpen(false)}>Menú</Link></li>
          {token ? (
            <>
              {(role === 'ADMIN' || role === 'CAJERO' || role === 'COCINERO') && (
                <li><Link to="/dashboard" onClick={() => setIsOpen(false)}>Panel</Link></li>
              )}
              <li><button onClick={handleLogout} className="btn-logout">Cerrar sesión</button></li>
            </>
          ) : (
            <li><Link to="/login" className="btn-login" onClick={() => setIsOpen(false)}>Iniciar sesión</Link></li>
          )}
        </ul>
      </div>
    </nav>
  )
}
