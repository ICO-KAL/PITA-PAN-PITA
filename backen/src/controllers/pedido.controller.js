const PedidoService = require('../services/pedido.service');
const { CreatePedidoDto } = require('../dtos/pedido.dto');

class PedidoController {
    async crearPedido(req, res) {
        try {
            const createPedidoDto = new CreatePedidoDto(req.body);
            createPedidoDto.validate();
            
            const pedido = await PedidoService.crearPedido(createPedidoDto);
            res.status(201).json(pedido);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async obtenerPedido(req, res) {
        try {
            const pedido = await PedidoService.obtenerPedidoPorId(req.params.id);
            res.json(pedido);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async actualizarEstado(req, res) {
        try {
            const { estado } = req.body;
            if (!['PENDIENTE', 'EN PROCESO', 'LISTO', 'ENTREGADO', 'CANCELADO'].includes(estado)) {
                throw new Error('Estado inválido');
            }

            const pedido = await PedidoService.actualizarEstadoPedido(req.params.id, estado);
            res.json(pedido);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async listarPorEstado(req, res) {
        try {
            const pedidos = await PedidoService.listarPedidosPorEstado(req.query.estado);
            res.json(pedidos);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

module.exports = new PedidoController();