-- Tabla de notificaciones para clientes
CREATE TABLE IF NOT EXISTS Notificaciones (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(255),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de ejemplo
INSERT INTO Notificaciones (titulo, descripcion, imagen_url) VALUES
('Nuevo combo familiar', 'Aprovecha nuestro combo familiar para 4 personas con bebida incluida.', 'https://images.unsplash.com/photo-1544027933-3c9e70e2a1f0?w=800'),
('Postre de temporada', 'Prueba nuestro postre especial de temporada con frutas frescas.', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800');
