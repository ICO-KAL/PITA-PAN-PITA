import { useEffect, useState } from 'react'
import './CartDrawer.css'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function CartDrawer({ open, onClose }) {
  const [items, setItems] = useState([])
  const [placing, setPlacing] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('carrito') || '[]')
    setItems(c)
  }, [open])

  const updateStorage = (next) => {
    setItems(next)
    localStorage.setItem('carrito', JSON.stringify(next))
  }

  const inc = (id) => updateStorage(items.map(it => it.id_producto===id?{...it,cantidad:it.cantidad+1}:it))
  const dec = (id) => updateStorage(items.map(it => it.id_producto===id?{...it,cantidad:Math.max(1,it.cantidad-1)}:it))
  const removeItem = (id) => updateStorage(items.filter(it => it.id_producto!==id))
  const clear = () => updateStorage([])

  const total = items.reduce((s,it)=> s + (Number(it.precio_venta)*it.cantidad), 0)

  async function aceptarPedido(){
    if(items.length===0) return
    setPlacing(true)
    try {
      const payload = {
        items: items.map(i=>({ id_producto:i.id_producto, cantidad:i.cantidad, precio_unitario:Number(i.precio_venta) }))
      }
      const res = await api.post('/pedidos', payload)
      setOrderId(res.data.id_pedido)
      // simulate payment step; show success on confirm
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Inicia sesión para completar tu pedido')
        onClose?.();
        navigate('/login')
        return
      }
      alert(err.response?.data?.message || 'No se pudo crear el pedido')
    } finally {
      setPlacing(false)
    }
  }

  async function confirmarPago(){
    try {
      if (!orderId) return
      // Enviar pago para confirmación del cajero
      await api.post('/pagos', { id_pedido: orderId, metodo: 'ONLINE', monto: total, referencia: 'web' })
      setShowSuccess(true)
      clear()
      setTimeout(()=>{
        setShowSuccess(false)
        setOrderId(null)
        onClose?.()
        if(orderId) {
          alert(`Pedido #${orderId} enviado con pago pendiente de confirmación. Puedes ver el seguimiento en: /track-order/${orderId}`)
        }
      }, 1500)
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Inicia sesión para completar tu pago')
        onClose?.();
        navigate('/login')
        return
      }
      alert(err.response?.data?.message || 'No se pudo enviar el pago')
    }
  }

  if(!open) return null

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e)=>e.stopPropagation()}>
        <div className="drawer-head">
          <h3>Tu carrito</h3>
          <button className="icon" onClick={onClose}>✕</button>
        </div>
        {items.length===0 ? (
          <p className="muted">No hay productos en el carrito.</p>
        ) : (
          <ul className="cart-list">
            {items.map(it=> (
              <li key={it.id_producto} className="cart-row">
                <div>
                  <div className="name">{it.nombre}</div>
                  <div className="sub">RD$ {Number(it.precio_venta).toFixed(2)}</div>
                </div>
                <div className="qty">
                  <button onClick={()=>dec(it.id_producto)}>-</button>
                  <span>{it.cantidad}</span>
                  <button onClick={()=>inc(it.id_producto)}>+</button>
                </div>
                <div className="row-total">RD$ {(Number(it.precio_venta)*it.cantidad).toFixed(2)}</div>
                <button className="icon" onClick={()=>removeItem(it.id_producto)}>🗑️</button>
              </li>
            ))}
          </ul>
        )}

        <div className="drawer-foot">
          <div className="sum">
            <span>Total</span>
            <strong>RD$ {total.toFixed(2)}</strong>
          </div>
          {!orderId ? (
            <button className="btn primary" disabled={placing || items.length===0} onClick={aceptarPedido}>
              {placing? 'Enviando...' : 'Aceptar pedido'}
            </button>
          ) : (
            <button className="btn success" onClick={confirmarPago}>Confirmar pago</button>
          )}
        </div>

        {showSuccess && (
          <div className="success-pop">
            <div className="check">✓</div>
            <div>Pago exitoso</div>
          </div>
        )}
      </div>
    </div>
  )
}
