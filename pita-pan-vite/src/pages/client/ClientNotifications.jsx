import { useEffect, useState } from 'react'
import api from '../../services/api'
import '../../styles/Client.css'

export default function ClientNotifications(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotificaciones()
  }, [])

  async function fetchNotificaciones(){
    try {
      const res = await api.get('/notificaciones')
      setItems(res.data)
    } catch(err){
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="client-notifs">
      <h2>Novedades</h2>
      {loading ? <p className="muted">Cargando...</p> : (
        items.length === 0 ? <p className="muted">Sin notificaciones por ahora</p> : (
          <div className="notif-grid">
            {items.map(n => (
              <div key={n.id_notificacion} className="notif-card">
                {n.imagen_url && <img src={n.imagen_url} alt={n.titulo} />}
                <div className="notif-body">
                  <h3>{n.titulo}</h3>
                  {n.descripcion && <p>{n.descripcion}</p>}
                  <div className="notif-date">{new Date(n.fecha).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
