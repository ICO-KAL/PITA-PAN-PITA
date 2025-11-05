import { useEffect, useState } from 'react'
import api from '../services/api'
import '../styles/Dashboard.css'
import { getAuth } from '../utils/jwt'

export default function Dashboard() {
  const [pedidos, setPedidos] = useState([])
  const [pedidoDetalle, setPedidoDetalle] = useState(null)
  const [estadoFiltro, setEstadoFiltro] = useState('PENDIENTE')
  const [adminTab, setAdminTab] = useState('PEDIDOS') // PEDIDOS | USUARIOS | CATALOGO | COMUNICACION
  const [mensajes, setMensajes] = useState({}) // { [id_pedido]: texto }
  const [{ role }] = useState(() => {
    const { role } = getAuth();
    return { role };
  })
  // Notifications state (solo ADMIN)
  const [notifs, setNotifs] = useState([])
  const [notifForm, setNotifForm] = useState({ titulo: '', descripcion: '', imagen_url: '' })
  const [postingNotif, setPostingNotif] = useState(false)
  // Pagos (CAJERO)
  const [pagosPendientes, setPagosPendientes] = useState([])
  // Online users (ADMIN)
  const [online, setOnline] = useState({ empleados: [], clientes: [] })
  // Usuarios (ADMIN)
  const [users, setUsers] = useState([])
  const [userForm, setUserForm] = useState({ nombre: '', email: '', password: '', rol: 'CAJERO', activo: true })
  const [editingUserId, setEditingUserId] = useState(null)
  const [savingUser, setSavingUser] = useState(false)
  // Productos (ADMIN)
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [prodForm, setProdForm] = useState({ nombre: '', descripcion: '', precio_venta: '', id_categoria: '', imagen_url: '', es_vendible: true })
  const [savingProd, setSavingProd] = useState(false)

  useEffect(() => {
    if (role === 'CAJERO') {
      fetchPagos()
      const i = setInterval(fetchPagos, 10000)
      return () => clearInterval(i)
    } else {
      fetchPedidos()
      const interval = setInterval(fetchPedidos, 10000) // refresh cada 10s
      return () => clearInterval(interval)
    }
  }, [estadoFiltro, role])

  useEffect(() => {
    if (role === 'ADMIN') {
      fetchNotifs()
      fetchProductos()
      fetchCategorias()
      fetchOnline()
      fetchUsers()
      const i = setInterval(fetchOnline, 30000)
      return () => clearInterval(i)
    }
  }, [role])

  async function fetchPedidos() {
    try {
      const res = await api.get('/pedidos', { params: { estado: estadoFiltro } })
      setPedidos(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function verDetalle(id) {
    try {
      const res = await api.get(`/pedidos/${id}`)
      setPedidoDetalle(res.data)
    } catch (err) {
      alert('Error cargando detalle')
    }
  }

  // Notificaciones (ADMIN)
  async function fetchNotifs() {
    try {
      const res = await api.get('/notificaciones')
      setNotifs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function crearNotificacion(e) {
    e.preventDefault()
    if (!notifForm.titulo?.trim()) return
    try {
      setPostingNotif(true)
      await api.post('/notificaciones', notifForm)
      setNotifForm({ titulo: '', descripcion: '', imagen_url: '' })
      await fetchNotifs()
      alert('Notificación publicada')
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo publicar la notificación')
    } finally {
      setPostingNotif(false)
    }
  }

  async function fetchOnline() {
    try {
      const res = await api.get('/users/online')
      setOnline(res.data)
    } catch {}
  }

  // Usuarios (ADMIN)
  async function fetchUsers(){
    try{
      const r = await api.get('/users')
      setUsers(r.data)
    }catch(err){
      console.error(err)
    }
  }
  function startEditUser(u){
    setEditingUserId(u.id_usuario)
    setUserForm({ nombre: u.nombre || '', email: u.email || '', password: '', rol: u.rol || 'CAJERO', activo: !!u.activo })
  }
  function resetUserForm(){
    setEditingUserId(null)
    setUserForm({ nombre: '', email: '', password: '', rol: 'CAJERO', activo: true })
  }
  async function createOrUpdateUser(e){
    e.preventDefault()
    if (!userForm.nombre || !userForm.email || (!editingUserId && !userForm.password)){
      alert('Nombre, email y contraseña (al crear) son requeridos')
      return
    }
    if (!['ADMIN','CAJERO','COCINERO'].includes(userForm.rol)){
      alert('Rol inválido')
      return
    }
    try{
      setSavingUser(true)
      if (editingUserId){
        const payload = { nombre: userForm.nombre, email: userForm.email, rol: userForm.rol, activo: userForm.activo }
        if (userForm.password) payload.password = userForm.password
        await api.put(`/users/${editingUserId}`, payload)
        alert('Usuario actualizado')
      } else {
        await api.post('/users', { nombre: userForm.nombre, email: userForm.email, password: userForm.password, rol: userForm.rol })
        alert('Usuario creado')
      }
      resetUserForm()
      fetchUsers()
    }catch(err){
      alert(err.response?.data?.error || 'No se pudo guardar el usuario')
    }finally{
      setSavingUser(false)
    }
  }
  async function deleteUser(id){
    if (!window.confirm('¿Desactivar este usuario?')) return
    try{
      await api.delete(`/users/${id}`)
      alert('Usuario desactivado')
      fetchUsers()
    }catch(err){
      alert(err.response?.data?.error || 'No se pudo desactivar')
    }
  }
  async function permanentDeleteUser(id){
    if (!window.confirm('⚠️ ADVERTENCIA: Esta acción eliminará permanentemente el usuario y no se puede deshacer.\n\n¿Estás seguro de continuar?')) return
    try{
      await api.delete(`/users/${id}/permanent`)
      alert('Usuario eliminado permanentemente')
      fetchUsers()
    }catch(err){
      alert(err.response?.data?.error || 'No se pudo eliminar')
    }
  }

  // Productos (ADMIN)
  async function fetchProductos(){
    try {
      const r = await api.get('/restaurants')
      setProductos(r.data)
    } catch{}
  }
  async function fetchCategorias(){
    try {
      const r = await api.get('/categorias')
      setCategorias(r.data || [])
    } catch{}
  }
  async function crearProducto(e){
    e.preventDefault()
    if (!prodForm.nombre || !prodForm.id_categoria || !prodForm.precio_venta){
      alert('Completa nombre, categoría y precio')
      return
    }
    try{
      setSavingProd(true)
      const payload = { ...prodForm, precio_venta: Number(prodForm.precio_venta), es_vendible: !!prodForm.es_vendible }
      await api.post('/restaurants', payload)
      setProdForm({ nombre: '', descripcion: '', precio_venta: '', id_categoria: '', imagen_url: '', es_vendible: true })
      fetchProductos()
      alert('Producto creado')
    }catch(err){
      alert(err.response?.data?.error || 'No se pudo crear el producto')
    }finally{
      setSavingProd(false)
    }
  }
  async function eliminarProducto(id){
    if (!window.confirm('¿Eliminar este producto?')) return
    try{
      await api.delete(`/restaurants/${id}`)
      fetchProductos()
    }catch(err){
      alert(err.response?.data?.error || 'No se pudo eliminar')
    }
  }

  // Pagos (CAJERO)
  async function fetchPagos() {
    if (role !== 'CAJERO') return
    try {
      const res = await api.get('/pagos/pendientes')
      setPagosPendientes(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function confirmarPago(id_pago, id_pedido) {
    try {
      await api.patch(`/pagos/${id_pago}/confirmar`)
      alert('Pago confirmado')
      fetchPagos()
      // al confirmar, refrescar pedidos por si el admin/cocinero lo ve
      fetchPedidos()
      if (pedidoDetalle?.pedido.id_pedido === id_pedido) verDetalle(id_pedido)
    } catch (err) {
      alert('No se pudo confirmar el pago')
    }
  }

  async function rechazarPago(id_pago) {
    try {
      await api.patch(`/pagos/${id_pago}/rechazar`)
      alert('Pago rechazado')
      fetchPagos()
    } catch (err) {
      alert('No se pudo rechazar el pago')
    }
  }

  async function cambiarEstado(id, nuevoEstado) {
    try {
      await api.patch(`/pedidos/${id}/estado`, { estado: nuevoEstado })
      fetchPedidos()
      if (pedidoDetalle?.pedido.id_pedido === id) {
        verDetalle(id)
      }
    } catch (err) {
      alert('Error actualizando estado')
    }
  }

  async function enviarActualizacion(id_pedido) {
    const texto = mensajes[id_pedido] || ''
    if (!texto.trim()) return
    try {
      await api.post('/seguimiento', { id_pedido, mensaje: texto })
      setMensajes(prev => ({ ...prev, [id_pedido]: '' }))
      alert('Actualización enviada al cliente')
      if (pedidoDetalle?.pedido.id_pedido === id_pedido) {
        verDetalle(id_pedido)
      }
    } catch (err) {
      alert('Error enviando actualización')
    }
  }

  // Vistas por rol
  if (role === 'CAJERO') {
    return (
      <div className="dash-admin">
        <div className="dash-sidebar">
          <h2>Pagos pendientes</h2>
          <p className="muted">Confirma o rechaza pagos enviados por clientes</p>
        </div>
        <div className="dash-content">
          {pagosPendientes.length === 0 ? (
            <div className="empty-state"><p>No hay pagos pendientes</p></div>
          ) : (
            <table className="productos-table">
              <thead>
                <tr>
                  <th># Pago</th>
                  <th># Pedido</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosPendientes.map(p => (
                  <tr key={p.id_pago}>
                    <td>{p.id_pago}</td>
                    <td>#{p.id_pedido}</td>
                    <td>{p.metodo}</td>
                    <td>RD$ {Number(p.monto).toFixed(2)}</td>
                    <td>{p.referencia || '-'}</td>
                    <td>{new Date(p.fecha).toLocaleString()}</td>
                    <td>
                      <button className="btn success" onClick={() => confirmarPago(p.id_pago, p.id_pedido)}>Confirmar</button>
                      <button className="btn ghost" onClick={() => rechazarPago(p.id_pago)}>Rechazar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  // Vista para COCINERO (enfoque en preparación)
  if (role === 'COCINERO') {
    return (
      <div className="dash-admin">
        <div className="dash-sidebar">
          <h2>Órdenes en cocina</h2>
          <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="filter-select">
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN PROCESO">En proceso</option>
          </select>
          <div className="pedidos-list">
            {pedidos.length === 0 ? (
              <p className="muted">No hay pedidos</p>
            ) : (
              pedidos.map(p => (
                <div key={p.id_pedido} className={`pedido-item ${pedidoDetalle?.pedido?.id_pedido === p.id_pedido ? 'active' : ''}`} onClick={() => verDetalle(p.id_pedido)}>
                  <div className="pedido-num">#{p.id_pedido}</div>
                  <div className="pedido-info">
                    <div className="pedido-estado">{p.estado}</div>
                    <div className="pedido-time">{new Date(p.fecha_hora).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="dash-content">
          {!pedidoDetalle ? (
            <div className="empty-state"><p>Selecciona un pedido</p></div>
          ) : (
            <>
              <div className="detalle-head">
                <h1>Pedido #{pedidoDetalle.pedido.id_pedido}</h1>
                <div className="estado-badge">{pedidoDetalle.pedido.estado}</div>
              </div>
              <div className="detalle-section">
                <h3>Recetas a preparar</h3>
                <ul>
                  {pedidoDetalle.detalles.map(d => (
                    <li key={d.id_detalle}>
                      {d.cantidad}x {d.nombre}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="detalle-section">
                <h3>Acciones</h3>
                <div className="estado-actions">
                  <button className="btn ghost" onClick={() => cambiarEstado(pedidoDetalle.pedido.id_pedido, 'EN PROCESO')}>Empezar</button>
                  <button className="btn success" onClick={() => cambiarEstado(pedidoDetalle.pedido.id_pedido, 'LISTO')}>Marcar listo</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Vista ADMIN (gestión de pedidos + notificaciones)
  return (
    <div className="dash-admin">
      <div className="dash-sidebar">
        <h2>Pedidos</h2>
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="filter-select">
          <option value="PENDIENTE">Pendientes</option>
          <option value="EN PROCESO">En proceso</option>
          <option value="LISTO">Listos</option>
          <option value="ENTREGADO">Entregados</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
        
        <div className="pedidos-list">
          {pedidos.length === 0 ? (
            <p className="muted">No hay pedidos</p>
          ) : (
            pedidos.map(p => (
              <div 
                key={p.id_pedido} 
                className={`pedido-item ${pedidoDetalle?.pedido?.id_pedido === p.id_pedido ? 'active' : ''}`}
                onClick={() => verDetalle(p.id_pedido)}
              >
                <div className="pedido-num">#{p.id_pedido}</div>
                <div className="pedido-info">
                  <div className="pedido-estado">{p.estado}</div>
                  <div className="pedido-time">{new Date(p.fecha_hora).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dash-content">
        {!pedidoDetalle ? (
          <div className="empty-state">
            <p>Selecciona un pedido para ver los detalles</p>
          </div>
        ) : (
          <>
            <div className="detalle-head">
              <h1>Pedido #{pedidoDetalle.pedido.id_pedido}</h1>
              <div className="estado-badge">{pedidoDetalle.pedido.estado}</div>
            </div>

            <div className="detalle-section">
              <h3>Información</h3>
              <p><strong>Mesero:</strong> {pedidoDetalle.pedido.nombre_mesero}</p>
              <p><strong>Fecha:</strong> {new Date(pedidoDetalle.pedido.fecha_hora).toLocaleString()}</p>
              {pedidoDetalle.pedido.notas_pedido && <p><strong>Notas:</strong> {pedidoDetalle.pedido.notas_pedido}</p>}
            </div>

            <div className="detalle-section">
              <h3>Productos</h3>
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoDetalle.detalles.map(d => (
                    <tr key={d.id_detalle}>
                      <td>{d.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>RD$ {parseFloat(d.precio_unitario).toFixed(2)}</td>
                      <td>RD$ {(d.cantidad * parseFloat(d.precio_unitario)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="detalle-section">
              <h3>Historial de seguimiento</h3>
              {pedidoDetalle.mensajes.length === 0 ? (
                <p className="muted">No hay actualizaciones aún</p>
              ) : (
                <div className="timeline-list">
                  {pedidoDetalle.mensajes.map(m => (
                    <div key={m.id_seguimiento} className="timeline-entry">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-msg">{m.mensaje}</div>
                        <div className="timeline-date">{new Date(m.fecha_hora).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="detalle-section">
              <h3>Cambiar estado</h3>
              <div className="estado-actions">
                <button className="btn ghost" onClick={() => cambiarEstado(pedidoDetalle.pedido.id_pedido, 'EN PROCESO')}>En proceso</button>
                <button className="btn success" onClick={() => cambiarEstado(pedidoDetalle.pedido.id_pedido, 'LISTO')}>Marcar listo</button>
                <button className="btn info" onClick={() => cambiarEstado(pedidoDetalle.pedido.id_pedido, 'ENTREGADO')}>Entregado</button>
              </div>
            </div>

            <div className="detalle-section update-section">
              <h3>Enviar actualización al cliente</h3>
              <textarea
                placeholder="Escribe una actualización para el cliente (ej: Tu pedido está siendo preparado por el chef...)"
                value={mensajes[pedidoDetalle.pedido.id_pedido] || ''}
                onChange={(e) => setMensajes(prev => ({ ...prev, [pedidoDetalle.pedido.id_pedido]: e.target.value }))}
                rows={3}
                className="update-input"
              />
              <button 
                className="btn primary"
                onClick={() => enviarActualizacion(pedidoDetalle.pedido.id_pedido)}
              >
                Enviar actualización
              </button>
            </div>

            {role === 'ADMIN' && (
              <div className="detalle-section">
                <h3>Publicar notificación</h3>
                <form onSubmit={crearNotificacion} className="notif-form">
                  <div className="form-grid">
                    <input
                      type="text"
                      placeholder="Título"
                      value={notifForm.titulo}
                      onChange={(e) => setNotifForm({ ...notifForm, titulo: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="URL de imagen (opcional)"
                      value={notifForm.imagen_url}
                      onChange={(e) => setNotifForm({ ...notifForm, imagen_url: e.target.value })}
                    />
                  </div>
                  <textarea
                    placeholder="Descripción (opcional)"
                    rows={3}
                    value={notifForm.descripcion}
                    onChange={(e) => setNotifForm({ ...notifForm, descripcion: e.target.value })}
                  />
                  <button type="submit" className="btn primary" disabled={postingNotif}>
                    {postingNotif ? 'Publicando...' : 'Publicar notificación'}
                  </button>
                </form>

                <div className="notifs-list">
                  {notifs.length === 0 ? (
                    <p className="muted">Sin notificaciones aún</p>
                  ) : (
                    <ul>
                      {notifs.map(n => (
                        <li key={n.id_notificacion} className="notif-item">
                          <div className="notif-title">{n.titulo}</div>
                          <div className="notif-date">{new Date(n.fecha).toLocaleString()}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {role === 'ADMIN' && (
              <div className="detalle-section">
                <h3>Usuarios conectados</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                  <div>
                    <h4>Empleados</h4>
                    {online.empleados.length===0? <p className="muted">—</p> : (
                      <ul>
                        {online.empleados.map(u => (
                          <li key={u.id_usuario}>
                            <span style={{color: u.online? '#2e7d32':'#b71c1c'}}>●</span> {u.nombre} <small>({u.rol})</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4>Clientes</h4>
                    {online.clientes.length===0? <p className="muted">—</p> : (
                      <ul>
                        {online.clientes.map(u => (
                          <li key={u.id_usuario}>
                            <span style={{color: u.online? '#2e7d32':'#b71c1c'}}>●</span> {u.nombre || u.email}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {role === 'ADMIN' && (
              <div className="detalle-section">
                <h3>Usuarios y roles</h3>
                <form onSubmit={createOrUpdateUser} className="notif-form">
                  <div className="form-grid">
                    <input placeholder="Nombre" value={userForm.nombre} onChange={e=>setUserForm({...userForm, nombre:e.target.value})} />
                    <input placeholder="Email" type="email" value={userForm.email} onChange={e=>setUserForm({...userForm, email:e.target.value})} />
                    <select value={userForm.rol} onChange={e=>setUserForm({...userForm, rol:e.target.value})}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="CAJERO">CAJERO</option>
                      <option value="COCINERO">COCINERO</option>
                    </select>
                    <input placeholder={editingUserId? 'Nueva contraseña (opcional)':'Contraseña'} type="password" value={userForm.password} onChange={e=>setUserForm({...userForm, password:e.target.value})} />
                  </div>
                  <label style={{display:'flex', alignItems:'center', gap:8}}>
                    <input type="checkbox" checked={userForm.activo} onChange={e=>setUserForm({...userForm, activo:e.target.checked})} /> Activo
                  </label>
                  <div style={{display:'flex', gap:8}}>
                    <button type="submit" className="btn primary" disabled={savingUser}>{savingUser? 'Guardando...': (editingUserId? 'Actualizar usuario':'Crear usuario')}</button>
                    {editingUserId && <button type="button" className="btn ghost" onClick={resetUserForm}>Cancelar</button>}
                  </div>
                </form>

                <div className="notifs-list">
                  {users.length===0? <p className="muted">Sin usuarios</p> : (
                    <table className="productos-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th>Activo</th>
                          <th>Última vez</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id_usuario}>
                            <td>{u.id_usuario}</td>
                            <td>{u.nombre}</td>
                            <td>{u.email}</td>
                            <td>{u.rol}</td>
                            <td>{u.activo? 'Sí':'No'}</td>
                            <td>{u.last_seen? new Date(u.last_seen).toLocaleString() : '—'}</td>
                            <td style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                              <button className="btn ghost" onClick={()=>startEditUser(u)}>Editar</button>
                              <button className="btn" onClick={()=>deleteUser(u.id_usuario)}>Desactivar</button>
                              <button className="btn" style={{backgroundColor:'#d32f2f', color:'white'}} onClick={()=>permanentDeleteUser(u.id_usuario)} title="Eliminar permanentemente">🗑️ Eliminar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {role === 'ADMIN' && (
              <div className="detalle-section">
                <h3>Catálogo de productos</h3>
                <form onSubmit={crearProducto} className="notif-form">
                  <div className="form-grid">
                    <input placeholder="Nombre" value={prodForm.nombre} onChange={e=>setProdForm({...prodForm, nombre:e.target.value})} />
                    <input placeholder="Precio" type="number" step="0.01" value={prodForm.precio_venta} onChange={e=>setProdForm({...prodForm, precio_venta:e.target.value})} />
                    <select value={prodForm.id_categoria} onChange={e=>setProdForm({...prodForm, id_categoria:e.target.value})}>
                      <option value="">Categoría...</option>
                      {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
                    </select>
                    <input placeholder="URL de imagen" value={prodForm.imagen_url} onChange={e=>setProdForm({...prodForm, imagen_url:e.target.value})} />
                  </div>
                  <textarea placeholder="Descripción" rows={2} value={prodForm.descripcion} onChange={e=>setProdForm({...prodForm, descripcion:e.target.value})} />
                  <label style={{display:'flex', alignItems:'center', gap:8}}>
                    <input type="checkbox" checked={prodForm.es_vendible} onChange={e=>setProdForm({...prodForm, es_vendible:e.target.checked})} /> Vendible
                  </label>
                  <button type="submit" className="btn primary" disabled={savingProd}>{savingProd? 'Guardando...' : 'Agregar producto'}</button>
                </form>

                <div className="notifs-list">
                  {productos.length===0? <p className="muted">Sin productos</p> : (
                    <ul>
                      {productos.map(p => (
                        <li key={p.id_producto} className="notif-item" style={{display:'grid',gridTemplateColumns:'80px 1fr auto',gap:'12px',alignItems:'center'}}>
                          <img src={p.imagen_url || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&fit=crop&auto=format&food=${encodeURIComponent(p.nombre)}` } alt={p.nombre} style={{width:80,height:60,objectFit:'cover',borderRadius:8}} />
                          <div>
                            <div className="notif-title">{p.nombre} <small style={{color:'#777'}}>RD$ {Number(p.precio_venta).toFixed(2)}</small></div>
                            <div className="notif-date">{p.descripcion || '—'}</div>
                          </div>
                          <button className="btn ghost" onClick={()=>eliminarProducto(p.id_producto)}>Eliminar</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
