import { useEffect, useState } from 'react'
import api from '../../services/api'
import '../../styles/Client.css'

export default function ClientOrderDetails(){
  const [pedidos, setPedidos] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelando, setCancelando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editItems, setEditItems] = useState([])

  useEffect(() => {
    fetchMisPedidos()
  }, [])

  useEffect(() => {
    if(selectedId) fetchDetalle(selectedId)
  }, [selectedId])

  async function fetchMisPedidos(){
    try {
      const res = await api.get('/pedidos/mis-pedidos')
      setPedidos(res.data)
      if(res.data.length>0) setSelectedId(res.data[0].id_pedido)
    } catch(err){
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDetalle(id){
    try {
      const res = await api.get(`/pedidos/${id}`)
      setDetalle(res.data)
      setEditItems(res.data.detalles.map(d => ({ id_detalle: d.id_detalle, id_producto: d.id_producto, nombre: d.nombre, cantidad: d.cantidad, precio_unitario: Number(d.precio_unitario) })))
    } catch(err){
      console.error(err)
    }
  }

  async function cancelarPedido(){
    if(!selectedId) return
    if(!window.confirm('¿Deseas cancelar este pedido?')) return
    setCancelando(true)
    try {
      await api.patch(`/pedidos/${selectedId}/cancelar`)
      await fetchMisPedidos()
      await fetchDetalle(selectedId)
      alert('Pedido cancelado. El empleado ha sido notificado.')
    } catch(err){
      alert('No se pudo cancelar: ' + (err.response?.data?.message || err.message))
    } finally {
      setCancelando(false)
    }
  }

  function actualizarCantidad(id_detalle, val){
    setEditItems(items => items.map(it => it.id_detalle===id_detalle?{...it, cantidad: Math.max(1, Number(val)||1)}:it))
  }
  function quitarItem(id_detalle){
    setEditItems(items => items.filter(it => it.id_detalle!==id_detalle))
  }

  async function guardarCambios(){
    try{
      const payload = { items: editItems.map(it => ({ id_producto: it.id_producto, cantidad: it.cantidad, precio_unitario: it.precio_unitario })) }
      await api.patch(`/pedidos/${selectedId}`, payload)
      setEditMode(false)
      await fetchDetalle(selectedId)
      alert('Pedido actualizado')
    }catch(err){
      alert(err.response?.data?.message || 'No se pudo actualizar el pedido (solo es posible si está PENDIENTE)')
    }
  }

  async function eliminarPedido(){
    if(!selectedId) return
    if(!window.confirm('¿Eliminar este pedido por completo? Esta acción no se puede deshacer.')) return
    try{
      await api.delete(`/pedidos/${selectedId}`)
      setSelectedId(null)
      setDetalle(null)
      await fetchMisPedidos()
      alert('Pedido eliminado')
    }catch(err){
      alert(err.response?.data?.message || 'No se pudo eliminar (solo PENDIENTE)')
    }
  }

  async function confirmarRecepcion(){
    if(!selectedId) return
    setConfirmando(true)
    try {
      await api.patch(`/pedidos/${selectedId}/confirmar`)
      await fetchDetalle(selectedId)
      alert('¡Gracias por confirmar la recepción!')
    } catch(err){
      alert('Error al confirmar: ' + (err.response?.data?.message || err.message))
    } finally {
      setConfirmando(false)
    }
  }

  const estado = detalle?.pedido?.estado
  const puedeCancelar = estado && !['ENTREGADO','CANCELADO'].includes(estado)
  const puedeEditarEliminar = estado === 'PENDIENTE'

  return (
    <div className="client-orders">
      <div className="client-orders-sidebar">
        <h3>Mis pedidos</h3>
        {loading ? <p className="muted">Cargando...</p> : (
          pedidos.length === 0 ? <p className="muted">Aún no tienes pedidos</p> : (
            <ul className="orders-list">
              {pedidos.map(p => (
                <li key={p.id_pedido} className={selectedId===p.id_pedido?'active':''} onClick={()=>setSelectedId(p.id_pedido)}>
                  <div className="order-id">#{p.id_pedido}</div>
                  <div className="order-meta">
                    <span className={`badge ${p.estado}`}>{p.estado}</span>
                    <span className="date">{new Date(p.fecha_hora).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <div className="client-orders-content">
        {!detalle ? (
          <div className="empty">
            <p>Selecciona un pedido para ver sus detalles</p>
          </div>
        ) : (
          <div className="order-detail">
            <div className="detail-head">
              <h2>Pedido #{detalle.pedido.id_pedido}</h2>
              <span className="badge big">{detalle.pedido.estado}</span>
            </div>
            <div className="detail-section">
              <h3>Seguimiento</h3>
              {detalle.mensajes.length === 0 ? (
                <p className="muted">Sin actualizaciones por el momento</p>
              ) : (
                <ul className="timeline">
                  {detalle.mensajes.map(m => (
                    <li key={m.id_seguimiento}>
                      <div className="time">{new Date(m.fecha_hora).toLocaleString()}</div>
                      <div className="msg">{m.mensaje}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="detail-section">
              <h3>Productos</h3>
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                    {editMode && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {(editMode?editItems:detalle.detalles).map(d => (
                    <tr key={d.id_detalle}>
                      <td>{d.nombre}</td>
                      <td>
                        {editMode ? (
                          <input style={{width:60}} type="number" min={1} value={d.cantidad} onChange={e=>actualizarCantidad(d.id_detalle, e.target.value)} />
                        ) : d.cantidad}
                      </td>
                      <td>RD$ {parseFloat(d.precio_unitario).toFixed(2)}</td>
                      <td>RD$ {(d.cantidad * parseFloat(d.precio_unitario)).toFixed(2)}</td>
                      {editMode && (
                        <td><button className="btn danger" onClick={()=>quitarItem(d.id_detalle)}>Quitar</button></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="detail-actions">
              {puedeEditarEliminar && !editMode && (
                <button className="btn primary" onClick={()=>setEditMode(true)}>Editar pedido</button>
              )}
              {puedeEditarEliminar && editMode && (
                <>
                  <button className="btn primary" onClick={guardarCambios}>Guardar cambios</button>
                  <button className="btn" onClick={()=>{setEditMode(false); setEditItems(detalle.detalles)}}>Cancelar edición</button>
                </>
              )}
              {puedeEditarEliminar && (
                <button className="btn danger" onClick={eliminarPedido}>Eliminar pedido</button>
              )}
              {puedeCancelar && (
                <button className="btn danger" onClick={cancelarPedido} disabled={cancelando}>
                  {cancelando ? 'Cancelando...' : '¿Cancelar pedido?'}
                </button>
              )}
              {estado === 'ENTREGADO' && !detalle.pedido.confirmado_cliente && (
                <button className="btn primary" onClick={confirmarRecepcion} disabled={confirmando}>
                  {confirmando ? 'Confirmando...' : 'Confirmar recepción'}
                </button>
              )}
              {detalle.pedido.confirmado_cliente && (
                <span className="ok">✓ Confirmado por el cliente</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
