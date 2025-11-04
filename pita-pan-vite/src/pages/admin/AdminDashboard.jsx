import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36 }}>Panel de Administración</h1>
      <p style={{ color: '#666' }}>Gestiona usuarios, inventario, reportes y configuración del sistema.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 24 }}>
        <Link className="card" to="/admin/users" style={cardStyle}>Usuarios y Roles</Link>
        <Link className="card" to="/admin/inventory" style={cardStyle}>Inventario</Link>
        <Link className="card" to="/admin/reports" style={cardStyle}>Reportes</Link>
        <Link className="card" to="/admin/audit" style={cardStyle}>Auditoría</Link>
        <Link className="card" to="/admin/settings" style={cardStyle}>Configuración</Link>
      </div>
    </div>
  )
}

const cardStyle = {
  padding: '1.5rem',
  border: '1px solid #eee',
  borderRadius: 12,
  textDecoration: 'none',
  color: '#111',
  background: '#fff',
  fontWeight: 600
}
