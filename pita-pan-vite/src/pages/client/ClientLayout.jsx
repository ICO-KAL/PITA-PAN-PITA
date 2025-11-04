import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import '../../styles/Client.css'

export default function ClientLayout() {
  const location = useLocation()
  const tab = location.pathname.split('/')[2] || 'menu'

  return (
    <div className="client-page">
      <Navbar />
      <div className="client-container">
        <aside className="client-sidebar">
          <ul>
            <li className={tab === 'menu' ? 'active' : ''}>
              <Link to="/cliente/menu">Menú</Link>
            </li>
            <li className={tab === 'detalles' ? 'active' : ''}>
              <Link to="/cliente/detalles">Detalles del pedido</Link>
            </li>
            <li className={tab === 'notificaciones' ? 'active' : ''}>
              <Link to="/cliente/notificaciones">Notificaciones</Link>
            </li>
          </ul>
        </aside>
        <main className="client-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
