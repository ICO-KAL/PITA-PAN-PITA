import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'
import '../styles/TrackOrder.css'

export default function TrackOrder() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    fetchPedido()
    const interval = setInterval(fetchPedido, 5000) // Poll every 5s
    return () => clearInterval(interval)
  }, [id])

  async function fetchPedido() {
    try {
      const res = await api.get(`/pedidos/${id}`)
      setPedido(res.data.pedido)
      setMensajes(res.data.mensajes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function confirmarRecepcion() {
    if (!window.confirm('¿Confirmas que recibiste tu pedido?')) return
    setConfirmando(true)
    try {
      await api.patch(`/pedidos/${id}/confirmar`)
      alert('¡Gracias por confirmar la recepción de tu pedido!')
      fetchPedido()
    } catch (err) {
      alert('Error al confirmar: ' + (err.response?.data?.error || err.message))
    } finally {
      setConfirmando(false)
    }
  }

  const estadoSteps = [
    { label: 'Pendiente', key: 'PENDIENTE', icon: '⏳' },
    { label: 'En proceso', key: 'EN PROCESO', icon: '🔄' },
    { label: 'Listo', key: 'LISTO', icon: '✅' },
    { label: 'Entregado', key: 'ENTREGADO', icon: '🚚' }
  ]

  function getEstadoIndex() {
    return estadoSteps.findIndex(s => s.key === pedido?.estado)
  }

  if (loading) return <div className="loading-track">Cargando seguimiento...</div>

  if (!pedido) return (
    <div>
      <Navbar />
      <div className="track-container">
        <h1>Pedido no encontrado</h1>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="track-container">
        <h1>Seguimiento de pedido #{pedido.id_pedido}</h1>
        
        <div className="visual-tracker">
          {estadoSteps.map((step, idx) => (
            <div key={step.key} className="tracker-step">
              <div className={`tracker-icon ${idx <= getEstadoIndex() ? 'active' : ''}`}>
                {step.icon}
              </div>
              <div className="tracker-label">{step.label}</div>
              {idx < estadoSteps.length - 1 && (
                <div className={`tracker-line ${idx < getEstadoIndex() ? 'active' : ''}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="track-timeline">
          <h2>Actualizaciones</h2>
          {mensajes.length === 0 ? (
            <p className="muted">No hay actualizaciones aún</p>
          ) : (
            <ul className="timeline">
              {mensajes.map((msg, idx) => (
                <li key={idx} className="timeline-item">
                  <div className="timeline-time">{new Date(msg.fecha_hora).toLocaleString()}</div>
                  <div className="timeline-msg">{msg.mensaje}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pedido.estado === 'ENTREGADO' && !pedido.confirmado_cliente && (
          <div className="confirm-section">
            <h3>¿Recibiste tu pedido?</h3>
            <button 
              className="btn-confirm" 
              onClick={confirmarRecepcion}
              disabled={confirmando}
            >
              {confirmando ? 'Confirmando...' : 'Confirmar recepción'}
            </button>
          </div>
        )}

        {pedido.confirmado_cliente && (
          <div className="confirmed-msg">
            <span className="check-icon">✓</span> Pedido confirmado por el cliente
          </div>
        )}

        <div className="track-details">
          <h3>Detalles del pedido</h3>
          <p>Estado: <strong>{pedido.estado}</strong></p>
          <p>Fecha: {new Date(pedido.fecha_hora).toLocaleString()}</p>
          {pedido.notas_pedido && <p>Notas: {pedido.notas_pedido}</p>}
        </div>
      </div>
    </div>
  )
}
