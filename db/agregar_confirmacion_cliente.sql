-- Agregar columna para confirmación de cliente en tabla Pedidos
ALTER TABLE Pedidos 
ADD COLUMN confirmado_cliente BOOLEAN DEFAULT FALSE 
COMMENT 'Indica si el cliente confirmó la recepción del pedido';
