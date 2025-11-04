const db = require('../config/database');
const { PedidoDto, DetallePedidoDto } = require('../dtos/pedido.dto');

class PedidoService {
    static instance = null;

    static getInstance() {
        if (!PedidoService.instance) {
            PedidoService.instance = new PedidoService();
        }
        return PedidoService.instance;
    }

    async crearPedido(createPedidoDto) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Insertar pedido
            const [result] = await conn.query(
                'INSERT INTO Pedidos (id_usuario_mesero, id_cliente, notas_pedido, estado) VALUES (?, ?, ?, ?)',
                [createPedidoDto.id_usuario_mesero, createPedidoDto.id_cliente, createPedidoDto.notas_pedido, 'PENDIENTE']
            );

            const idPedido = result.insertId;

            // Insertar detalles
            for (const detalle of createPedidoDto.detalles) {
                // Obtener precio actual del producto
                const [productos] = await conn.query(
                    'SELECT precio_venta FROM Productos WHERE id_producto = ?',
                    [detalle.id_producto]
                );

                if (productos.length === 0) {
                    throw new Error(`Producto ${detalle.id_producto} no encontrado`);
                }

                await conn.query(
                    'INSERT INTO DetallePedido (id_pedido, id_producto, cantidad, precio_unitario, notas_personalizacion) VALUES (?, ?, ?, ?, ?)',
                    [idPedido, detalle.id_producto, detalle.cantidad, productos[0].precio_venta, detalle.notas_personalizacion]
                );
            }

            await conn.commit();
            
            // Retornar pedido creado con sus detalles
            return this.obtenerPedidoPorId(idPedido);

        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    async obtenerPedidoPorId(idPedido) {
        const [pedidos] = await db.query(
            `SELECT p.*, u.nombre as nombre_mesero, c.nombre as nombre_cliente
             FROM Pedidos p 
             LEFT JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario
             LEFT JOIN Clientes c ON p.id_cliente = c.id_cliente
             WHERE p.id_pedido = ?`,
            [idPedido]
        );

        if (pedidos.length === 0) {
            throw new Error('Pedido no encontrado');
        }

        const [detalles] = await db.query(
            `SELECT d.*, p.nombre as nombre_producto
             FROM DetallePedido d
             JOIN Productos p ON d.id_producto = p.id_producto
             WHERE d.id_pedido = ?`,
            [idPedido]
        );

        const pedido = new PedidoDto({
            ...pedidos[0],
            detalles: detalles.map(d => new DetallePedidoDto(d))
        });

        return pedido;
    }

    async actualizarEstadoPedido(idPedido, nuevoEstado) {
        const [result] = await db.query(
            'UPDATE Pedidos SET estado = ? WHERE id_pedido = ?',
            [nuevoEstado, idPedido]
        );

        if (result.affectedRows === 0) {
            throw new Error('Pedido no encontrado');
        }

        return this.obtenerPedidoPorId(idPedido);
    }

    async listarPedidosPorEstado(estado) {
        const [pedidos] = await db.query(
              'SELECT p.*, u.nombre as nombre_mesero, c.nombre as nombre_cliente ' +
              'FROM Pedidos p ' +
              'LEFT JOIN Usuarios u ON p.id_usuario_mesero = u.id_usuario ' +
              'LEFT JOIN Clientes c ON p.id_cliente = c.id_cliente ' +
              'WHERE p.estado = ? ' +
              'ORDER BY p.fecha_hora DESC',
            [estado]
        );

        return pedidos.map(p => new PedidoDto(p));
    }
}

module.exports = PedidoService.getInstance();