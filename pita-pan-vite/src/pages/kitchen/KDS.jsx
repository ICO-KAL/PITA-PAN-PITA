export default function KDS() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32 }}>Cocina (KDS)</h1>
      <p style={{ color: '#666' }}>Pantalla de cocina para ver y actualizar pedidos en tiempo real (pendiente de WebSocket).</p>
      <div style={{ marginTop: 24, border: '1px dashed #ccc', padding: 16, borderRadius: 12 }}>
        <p>Pronto: columnas por estado (Pendiente, En proceso, Listo), sonido de nuevos pedidos, tiempos de preparación.</p>
      </div>
    </div>
  )
}
