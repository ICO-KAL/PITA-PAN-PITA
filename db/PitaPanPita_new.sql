CREATE TABLE Roles (
    id_rol INT PRIMARY KEY AUTO_INCREMENT,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE -- Ej: 'Admin', 'Mesero', 'Cocina', 'Cajero'
);

-- Tabla de Usuarios (HU-24, HU-25)
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_rol INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE, -- Para deshabilitar (HU-24)
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- Tabla de Auditoría (HU-26)
CREATE TABLE Auditoria (
    id_log BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    detalle_cambio TEXT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(45),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- 3. EP02: Control de Inventario y Productos
-- Tabla de Categorías
CREATE TABLE Categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de Productos (Lo que se vende en el menú) (HU-07 CRUD)
CREATE TABLE Productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(10, 2) NOT NULL,
    es_vendible BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)
);

-- Tabla de Insumos (Materia prima) (HU-07 CRUD, HU-09)
CREATE TABLE Insumos (
    id_insumo INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    stock_actual DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    unidad_medida VARCHAR(20) NOT NULL, -- Ej: 'gramos', 'mililitros'
    stock_minimo DECIMAL(10, 3) NOT NULL DEFAULT 0.000 -- HU-09
);

-- Tabla Receta (Relación Producto N:M Insumo - Descuento automático) (HU-08)
CREATE TABLE Receta (
    id_producto INT,
    id_insumo INT,
    cantidad_requerida DECIMAL(10, 3) NOT NULL,
    PRIMARY KEY (id_producto, id_insumo),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto),
    FOREIGN KEY (id_insumo) REFERENCES Insumos(id_insumo)
);

-- Tabla MovimientoInventario (Registro de entradas/salidas/ajustes) (HU-10, HU-11)
CREATE TABLE MovimientoInventario (
    id_movimiento BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_insumo INT NOT NULL,
    id_usuario INT NOT NULL, -- Quien realiza el ajuste
    tipo_movimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    cantidad DECIMAL(10, 3) NOT NULL,
    justificacion TEXT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_insumo) REFERENCES Insumos(id_insumo),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

-- 4. EP01: Gestión de Pedidos Digitales
-- Tabla de Pedidos (HU-01, HU-02, HU-03)
CREATE TABLE Pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario_mesero INT NOT NULL, -- Quien tomó el pedido
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE', 'EN PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO') NOT NULL, -- HU-02
    notas_pedido TEXT,
    FOREIGN KEY (id_usuario_mesero) REFERENCES Usuarios(id_usuario)
);

-- Tabla DetallePedido (HU-01, HU-05)
CREATE TABLE DetallePedido (
    id_detalle BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    notas_personalizacion TEXT,
    estado_cocina ENUM('PENDIENTE', 'PREPARANDO', 'COMPLETADO') NOT NULL DEFAULT 'PENDIENTE', -- HU-05
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

-- 5. EP03: Facturación, Cobro y Gestión de Caja
-- Tabla Facturas (HU-12, HU-16)
CREATE TABLE Facturas (
    id_factura INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT UNIQUE NOT NULL, -- Una factura por pedido
    id_usuario_cajero INT NOT NULL, -- Quien realiza la facturación
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10, 2) NOT NULL,
    impuestos DECIMAL(10, 2) NOT NULL,
    porcentaje_descuento DECIMAL(5, 2) DEFAULT 0.00, -- HU-16
    descuento_aplicado DECIMAL(10, 2) DEFAULT 0.00,
    total_pagar DECIMAL(10, 2) NOT NULL,
    estado ENUM('PENDIENTE', 'PAGADA', 'ANULADA') NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
    FOREIGN KEY (id_usuario_cajero) REFERENCES Usuarios(id_usuario)
);

-- Tabla Pagos (HU-13, HU-14, HU-15)
CREATE TABLE Pagos (
    id_pago BIGINT PRIMARY KEY AUTO_INCREMENT,
    id_factura INT NOT NULL,
    metodo_pago ENUM('EFECTIVO', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA') NOT NULL,
    monto_pagado DECIMAL(10, 2) NOT NULL,
    referencia_pago VARCHAR(255),
    cambio_entregado DECIMAL(10, 2) DEFAULT 0.00, -- Para pagos en efectivo (HU-13)
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_factura) REFERENCES Facturas(id_factura)
);

-- Tabla Caja (Cierres de Caja) (HU-17)
CREATE TABLE Caja (
    id_caja INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario_cajero INT NOT NULL,
    fecha_apertura TIMESTAMP NOT NULL,
    fecha_cierre TIMESTAMP NULL,
    monto_inicial DECIMAL(10, 2) NOT NULL,
    monto_esperado DECIMAL(10, 2),
    monto_contado DECIMAL(10, 2),
    diferencia DECIMAL(10, 2), -- Faltante/Sobrante
    FOREIGN KEY (id_usuario_cajero) REFERENCES Usuarios(id_usuario)
);