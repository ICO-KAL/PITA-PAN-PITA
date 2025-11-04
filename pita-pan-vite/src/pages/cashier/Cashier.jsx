export default function Cashier() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32 }}>Caja</h1>
      <p style={{ color: '#666' }}>Facturación, pagos y cierre de caja (pendiente de conectar).</p>
      <div style={{ marginTop: 24, border: '1px dashed #ccc', padding: 16, borderRadius: 12 }}>
        <p>
          Aquí verás los pedidos listos para facturar, podrás aplicar descuentos y registrar diferentes métodos de pago.
        </p>
      </div>
    </div>
  )
}
