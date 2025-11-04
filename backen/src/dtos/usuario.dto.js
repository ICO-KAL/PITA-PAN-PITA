class UsuarioDto {
    constructor(data) {
        this.id_usuario = data.id_usuario;
        this.id_rol = data.id_rol;
        this.nombre = data.nombre;
        this.email = data.email;
        this.activo = data.activo;
        // No incluimos contraseña_hash por seguridad
    }

    toJSON() {
        return {
            id_usuario: this.id_usuario,
            id_rol: this.id_rol,
            nombre: this.nombre,
            email: this.email,
            activo: this.activo
        };
    }
}

class CreateUsuarioDto {
    constructor(data) {
        this.nombre = data.nombre;
        this.email = data.email;
        this.contrasena = data.contrasena; // Plain password, will be hashed
        this.id_rol = data.id_rol;
    }

    validate() {
        if (!this.nombre || !this.email || !this.contrasena || !this.id_rol) {
            throw new Error('Todos los campos son requeridos');
        }
        if (!this.email.includes('@')) {
            throw new Error('Email inválido');
        }
        if (this.contrasena.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
    }
}

module.exports = { UsuarioDto, CreateUsuarioDto };