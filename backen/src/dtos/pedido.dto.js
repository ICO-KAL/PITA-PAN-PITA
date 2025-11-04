class PedidoDto {
    constructor(data) {
        this.id_pedido = data.id_pedido;
        this.id_usuario_mesero = data.id_usuario_mesero;
        this.id_cliente = data.id_cliente;
        this.fecha_hora = data.fecha_hora;
        this.estado = data.estado;
        this.notas_pedido = data.notas_pedido;
        this.detalles = data.detalles || [];
    }

    toJSON() {
        return {
            id_pedido: this.id_pedido,
            id_usuario_mesero: this.id_usuario_mesero,
            id_cliente: this.id_cliente,
            fecha_hora: this.fecha_hora,
            estado: this.estado,
            notas_pedido: this.notas_pedido,
            detalles: this.detalles
        };
    }
}

class CreatePedidoDto {
    constructor(data) {
        this.id_usuario_mesero = data.id_usuario_mesero;
        this.id_cliente = data.id_cliente;
        this.notas_pedido = data.notas_pedido;
        this.detalles = data.detalles || [];
    }

    validate() {
        if (!this.id_usuario_mesero || !Array.isArray(this.detalles) || this.detalles.length === 0) {
            throw new Error('Mesero y detalles del pedido son requeridos');
        }

        this.detalles.forEach(detalle => {
            if (!detalle.id_producto || !detalle.cantidad || detalle.cantidad <= 0) {
                throw new Error('Cada detalle debe tener producto y cantidad válida');
            }
        });
    }
}

class DetallePedidoDto {
    constructor(data) {
        this.id_detalle = data.id_detalle;
        this.id_pedido = data.id_pedido;
        this.id_producto = data.id_producto;
        this.cantidad = data.cantidad;
        this.precio_unitario = data.precio_unitario;
        this.notas_personalizacion = data.notas_personalizacion;
        this.estado_cocina = data.estado_cocina;
    }
}

module.exports = { PedidoDto, CreatePedidoDto, DetallePedidoDto };