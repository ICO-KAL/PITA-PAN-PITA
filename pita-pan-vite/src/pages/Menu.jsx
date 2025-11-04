import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import '../styles/Menu.css'
import CartDrawer from '../components/CartDrawer'
import { getAuth } from '../utils/jwt'

export default function Menu({ showNavbar = true }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaActiva, setCategoriaActiva] = useState('all')
  const [carrito, setCarrito] = useState([])
  const [loading, setLoading] = useState(true)
  const [openCart, setOpenCart] = useState(false)
  const { token } = getAuth()
  const enableCart = Boolean(token)

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
    // Cargar carrito del localStorage
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito') || '[]')
    setCarrito(carritoGuardado)
  }, [])

  async function fetchProductos() {
    try {
      const res = await api.get('/restaurants') // usa endpoint existente que mapea a Productos
      setProductos(res.data)
    } catch (err) {
      console.error('Error cargando productos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategorias() {
    try {
      const res = await api.get('/categorias')
      setCategorias(res.data || [])
    } catch (err) {
      console.error('Error cargando categorías:', err)
    }
  }

  function agregarAlCarrito(producto) {
    const itemExistente = carrito.find(item => item.id_producto === producto.id_producto)
    let nuevoCarrito

    if (itemExistente) {
      nuevoCarrito = carrito.map(item =>
        item.id_producto === producto.id_producto
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    } else {
      nuevoCarrito = [...carrito, { ...producto, cantidad: 1 }]
    }

    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito))
    alert(`${producto.nombre} agregado al carrito`)
  }

  function getTotalCarrito() {
    return carrito.reduce((sum, item) => sum + (item.precio_venta * item.cantidad), 0)
  }

  const productosFiltrados = categoriaActiva === 'all' 
    ? productos 
    : productos.filter(p => p.id_categoria === parseInt(categoriaActiva))

  return (
    <div className="menu-page">
      {showNavbar && <Navbar />}
      
      <div className="menu-hero">
        <h1>Nuestro Menú</h1>
        <p>Descubre nuestra selección de platillos artesanales</p>
      </div>

      <div className="menu-container">
        <aside className="menu-sidebar">
          {enableCart && (
            <div className="cart-widget">
              <h3>🛒 Carrito</h3>
              <div className="cart-total">
                <span>Total:</span>
                <span className="price">RD$ {getTotalCarrito().toFixed(2)}</span>
              </div>
              <p className="cart-items">{carrito.length} productos</p>
              {carrito.length > 0 && (
                <button className="btn-checkout" onClick={() => setOpenCart(true)}>Ver carrito</button>
              )}
            </div>
          )}

          <div className="categories">
            <h3>Categorías</h3>
            <button 
              className={`category-btn ${categoriaActiva === 'all' ? 'active' : ''}`}
              onClick={() => setCategoriaActiva('all')}
            >
              🍽️ Todo
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id_categoria}
                className={`category-btn ${categoriaActiva === cat.id_categoria ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat.id_categoria)}
              >
                {cat.nombre_categoria}
              </button>
            ))}
          </div>

          {enableCart && (
            <div className="filters">
              <h3>Ordenar por</h3>
              <select className="sort-select">
                <option value="popular">Más popular</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
            </div>
          )}
        </aside>

        <main className="menu-content">
          {loading ? (
            <div className="loading">Cargando productos...</div>
          ) : productosFiltrados.length === 0 ? (
            <div className="no-products">
              <p>No hay productos disponibles en esta categoría.</p>
            </div>
          ) : (
            <div className="products-grid">
              {productosFiltrados.map(producto => (
                <div key={producto.id_producto} className="product-card">
                  <div className="product-image">
                    <img 
                      src={producto.imagen_url || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&fit=crop&auto=format&food=${encodeURIComponent(producto.nombre)}`}
                      alt={producto.nombre}
                    />
                    {!producto.es_vendible && (
                      <div className="product-badge">No disponible</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>
                      <button className="product-name" onClick={() => { agregarAlCarrito(producto); setOpenCart(true) }}>
                        {producto.nombre}
                      </button>
                    </h3>
                    <p className="product-description">
                      {producto.descripcion || 'Delicioso platillo preparado con ingredientes frescos'}
                    </p>
                    <div className="product-footer">
                      <span className="product-price">RD$ {parseFloat(producto.precio_venta).toFixed(2)}</span>
                      {enableCart && (
                        <button 
                          className="btn-add-cart"
                          onClick={() => agregarAlCarrito(producto)}
                          disabled={!producto.es_vendible}
                        >
                          {producto.es_vendible ? '+ Agregar' : 'Agotado'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {enableCart && <CartDrawer open={openCart} onClose={()=>setOpenCart(false)} />}
    </div>
  )
}
