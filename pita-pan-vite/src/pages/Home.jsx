import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../styles/Home.css'

export default function Home() {
  return (
    <div className="home">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Cocina tradicional</h1>
          <p>Con ese toque de vanguardia que nos hace únicos</p>
          <div className="hero-buttons">
            <Link to="/menu" className="btn btn-primary">Ver menú</Link>
            <Link to="/register" className="btn btn-secondary">Pedir ahora</Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800" alt="El restaurante" />
            </div>
            <div className="about-content">
              <h2>El restaurante</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
              <Link to="/menu" className="btn btn-outline">Descubre más</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">¿Por qué elegirnos?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍳</div>
              <h3>Cocina artesanal</h3>
              <p>Cada plato preparado con dedicación y los mejores ingredientes</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Pedidos en línea</h3>
              <p>Ordena fácilmente desde tu dispositivo y recibe notificaciones</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Servicio rápido</h3>
              <p>Tu comida lista en el menor tiempo posible</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Pita Pan Pita</h3>
              <p>Cocina tradicional con un toque moderno</p>
            </div>
            <div className="footer-section">
              <h4>Horario</h4>
              <p>Lunes - Viernes: 9:00 AM - 10:00 PM</p>
              <p>Sábado - Domingo: 10:00 AM - 11:00 PM</p>
            </div>
            <div className="footer-section">
              <h4>Contacto</h4>
              <p>Tel: (809) 555-1234</p>
              <p>Email: info@pitapanpita.com</p>
            </div>
            <div className="footer-section">
              <h4>Administración</h4>
              <p style={{fontSize: '.9rem', color: '#999', marginBottom: '.5rem'}}>Solo para empleados del sitio</p>
              <Link to="/employee-login" style={{color: '#e65c1f', textDecoration: 'underline', fontWeight: 600}}>
                Acceso de empleados →
              </Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Pita Pan Pita. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
