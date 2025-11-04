-- Tabla para mensajes de seguimiento de pedidos (para que el cliente vea actualizaciones en tiempo real)
CREATE TABLE IF NOT EXISTS SeguimientoPedido (
    id_seguimiento BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_usuario INT NOT NULL, -- Empleado que envía el mensaje
    mensaje TEXT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);
