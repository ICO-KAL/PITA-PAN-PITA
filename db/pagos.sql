-- Tabla de pagos para confirmación por caja
CREATE TABLE IF NOT EXISTS Pagos (
  id_pago BIGINT PRIMARY KEY AUTO_INCREMENT,
  id_pedido INT NOT NULL,
  id_usuario INT NOT NULL, -- quien envía el pago (cliente)
  metodo VARCHAR(50) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia VARCHAR(255) NULL,
  estado ENUM('PENDIENTE','CONFIRMADO','RECHAZADO') DEFAULT 'PENDIENTE',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);
