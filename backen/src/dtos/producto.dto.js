class ProductoDto {
    constructor(data) {
        this.id_producto = data.id_producto;
        this.id_categoria = data.id_categoria;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.precio_venta = data.precio_venta;
        this.es_vendible = data.es_vendible;
        this.categoria = data.categoria; // Join info
    }

    toJSON() {
        return {
            id_producto: this.id_producto,
            id_categoria: this.id_categoria,
            nombre: this.nombre,
            descripcion: this.descripcion,
            precio_venta: this.precio_venta,
            es_vendible: this.es_vendible,
            categoria: this.categoria
        };
    }
}

class CreateProductoDto {
    constructor(data) {
        this.id_categoria = data.id_categoria;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.precio_venta = data.precio_venta;
        this.es_vendible = data.es_vendible !== false;
    }

    validate() {
        if (!this.id_categoria || !this.nombre || !this.precio_venta) {
            throw new Error('Categoría, nombre y precio son requeridos');
        }
        if (this.precio_venta <= 0) {
            throw new Error('El precio debe ser mayor a 0');
        }
    }
}

module.exports = { ProductoDto, CreateProductoDto };