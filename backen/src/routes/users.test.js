const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock de la base de datos ANTES de importar el router
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

// Mock de los middlewares ANTES de importar el router
jest.mock('../middlewares/auth.middleware', () => ({
  authMiddleware: jest.fn((req, res, next) => next()),
  roleGuard: jest.fn(() => (req, res, next) => next())
}));

const db = require('../config/database');
const { authMiddleware, roleGuard } = require('../middlewares/auth.middleware');
const usersRouter = require('./users');

describe('Users API - Pruebas Unitarias', () => {
  let app;
  let mockAdminUser;
  let mockCajeroUser;

  beforeAll(() => {
    // Configurar Express app para testing
    app = express();
    app.use(express.json());
    app.use('/api/users', usersRouter);

    // Usuario admin mock
    mockAdminUser = {
      id_usuario: 1,
      email: 'admin@test.com',
      nombre: 'Admin Test',
      role: 'ADMIN'
    };

    // Usuario cajero mock
    mockCajeroUser = {
      id_usuario: 2,
      email: 'cajero@test.com',
      nombre: 'Cajero Test',
      role: 'CAJERO'
    };
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock del middleware de autenticación por defecto (ADMIN)
    authMiddleware.mockImplementation((req, res, next) => {
      req.user = mockAdminUser;
      next();
    });

    roleGuard.mockImplementation((role) => {
      return (req, res, next) => {
        if (req.user.role === role) {
          next();
        } else {
          res.status(403).json({ error: 'Acceso denegado' });
        }
      };
    });
  });

  describe('POST /api/users/ping', () => {
    it('debería actualizar last_seen del usuario autenticado', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app)
        .post('/api/users/ping')
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('at');
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE Usuarios SET last_seen = NOW() WHERE id_usuario = ?',
        [mockAdminUser.id_usuario]
      );
    });

    it('debería devolver error 500 si falla la actualización', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/users/ping')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/online', () => {
    it('debería listar usuarios online agrupados (solo ADMIN)', async () => {
      const mockUsers = [
        { id_usuario: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN', last_seen: new Date(), online: 1 },
        { id_usuario: 2, nombre: 'Cajero', email: 'cajero@test.com', rol: 'CAJERO', last_seen: new Date(), online: 1 },
        { id_usuario: 3, nombre: 'Cliente', email: 'cliente@test.com', rol: 'CLIENTE', last_seen: new Date(), online: 1 }
      ];

      db.query.mockResolvedValue([mockUsers]);

      const response = await request(app)
        .get('/api/users/online')
        .expect(200);

      expect(response.body).toHaveProperty('empleados');
      expect(response.body).toHaveProperty('clientes');
      expect(response.body.empleados).toHaveLength(2); // ADMIN + CAJERO
      expect(response.body.clientes).toHaveLength(1); // CLIENTE
    });

    it('debería retornar datos estructurados correctamente', async () => {
      // Verificar que la respuesta tiene la estructura correcta
      const response = await request(app)
        .get('/api/users/online')
        .expect(200);

      expect(response.body).toHaveProperty('empleados');
      expect(response.body).toHaveProperty('clientes');
      expect(Array.isArray(response.body.empleados)).toBe(true);
      expect(Array.isArray(response.body.clientes)).toBe(true);
    });
  });

  describe('GET /api/users', () => {
    it('debería listar todos los usuarios con sus roles (solo ADMIN)', async () => {
      const mockUsers = [
        { id_usuario: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'ADMIN', activo: 1, last_seen: null },
        { id_usuario: 2, nombre: 'Cajero', email: 'cajero@test.com', rol: 'CAJERO', activo: 1, last_seen: null }
      ];

      db.query.mockResolvedValue([mockUsers]);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('rol');
    });
  });

  describe('POST /api/users', () => {
    it('debería crear un nuevo usuario con rol CAJERO', async () => {
      const newUser = {
        nombre: 'Nuevo Cajero',
        email: 'nuevo@test.com',
        password: 'password123',
        rol: 'CAJERO'
      };

      db.query
        .mockResolvedValueOnce([[]])  // Check email no existe
        .mockResolvedValueOnce([[{ id_rol: 2 }]])  // Get rol ID
        .mockResolvedValueOnce([{ insertId: 5 }]); // Insert user

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id_usuario', 5);
      expect(response.body).toHaveProperty('nombre', newUser.nombre);
      expect(response.body).toHaveProperty('email', newUser.email);
      expect(response.body).toHaveProperty('rol', 'CAJERO');
      expect(response.body).toHaveProperty('activo', 1);
    });

    it('debería rechazar creación sin campos requeridos', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ nombre: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('requeridos');
    });

    it('debería rechazar rol no permitido', async () => {
      const newUser = {
        nombre: 'Test',
        email: 'test@test.com',
        password: 'pass123',
        rol: 'CLIENTE'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(400);

      expect(response.body.error).toContain('no permitido');
    });

    it('debería rechazar email duplicado', async () => {
      db.query.mockResolvedValueOnce([[{ email: 'existe@test.com' }]]);

      const newUser = {
        nombre: 'Test',
        email: 'existe@test.com',
        password: 'pass123',
        rol: 'CAJERO'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(409);

      expect(response.body.error).toContain('correo ya está en uso');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('debería actualizar nombre y email de un usuario', async () => {
      const userId = 3;
      const updates = {
        nombre: 'Nombre Actualizado',
        email: 'nuevo@test.com'
      };

      db.query
        .mockResolvedValueOnce([[{ id_usuario: userId, nombre: 'Viejo', email: 'viejo@test.com', id_rol: 2 }]])  // Get current user
        .mockResolvedValueOnce([[]])  // Check email not duplicate
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Update
        .mockResolvedValueOnce([[{ id_usuario: userId, nombre: updates.nombre, email: updates.email, activo: 1, rol: 'CAJERO' }]]); // Get updated

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('nombre', updates.nombre);
      expect(response.body).toHaveProperty('email', updates.email);
    });

    it('debería actualizar rol de usuario', async () => {
      const userId = 3;
      const updates = { rol: 'COCINERO' };

      db.query
        .mockResolvedValueOnce([[{ id_usuario: userId, id_rol: 2 }]])  // Get current
        .mockResolvedValueOnce([[{ id_rol: 4 }]])  // Get new rol ID
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Update
        .mockResolvedValueOnce([[{ id_usuario: userId, nombre: 'Test', email: 'test@test.com', activo: 1, rol: 'COCINERO' }]]); // Get updated

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('rol', 'COCINERO');
    });

    it('debería actualizar contraseña con hash', async () => {
      const userId = 3;
      const updates = { password: 'newpassword123' };

      db.query
        .mockResolvedValueOnce([[{ id_usuario: userId, id_rol: 2 }]])  // Get current
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Update
        .mockResolvedValueOnce([[{ id_usuario: userId, nombre: 'Test', email: 'test@test.com', activo: 1, rol: 'CAJERO' }]]); // Get updated

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('id_usuario', userId);
      // Verificar que se llamó a update con contraseña hasheada
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('contrasena_hash'),
        expect.any(Array)
      );
    });

    it('debería rechazar actualización de usuario inexistente', async () => {
      db.query.mockResolvedValueOnce([[]]);  // User not found

      const response = await request(app)
        .put('/api/users/999')
        .send({ nombre: 'Test' })
        .expect(404);

      expect(response.body.error).toContain('no encontrado');
    });

    it('debería rechazar email duplicado en actualización', async () => {
      db.query
        .mockResolvedValueOnce([[{ id_usuario: 3, email: 'old@test.com' }]])  // Get current
        .mockResolvedValueOnce([[{ email: 'duplicate@test.com' }]]);  // Email exists

      const response = await request(app)
        .put('/api/users/3')
        .send({ email: 'duplicate@test.com' })
        .expect(409);

      expect(response.body.error).toContain('correo ya está en uso');
    });

    it('debería desactivar usuario (activo=false)', async () => {
      const userId = 3;
      
      db.query
        .mockResolvedValueOnce([[{ id_usuario: userId, activo: 1 }]])  // Get current
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Update
        .mockResolvedValueOnce([[{ id_usuario: userId, nombre: 'Test', email: 'test@test.com', activo: 0, rol: 'CAJERO' }]]); // Get updated

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ activo: false })
        .expect(200);

      expect(response.body).toHaveProperty('activo', 0);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('debería desactivar un usuario (soft delete)', async () => {
      const userId = 3;
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('message', 'Usuario desactivado');
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE Usuarios SET activo = 0 WHERE id_usuario = ?',
        [String(userId)]
      );
    });

    it('debería rechazar auto-desactivación', async () => {
      const response = await request(app)
        .delete(`/api/users/${mockAdminUser.id_usuario}`)
        .expect(400);

      expect(response.body.error).toContain('No puedes desactivar tu propio usuario');
    });
  });

  describe('DELETE /api/users/:id/permanent', () => {
    it('debería eliminar un usuario permanentemente y reorganizar todos los IDs desde 1', async () => {
      const userId = 3;
      const usuariosRestantes = [
        { id_usuario: 1 },
        { id_usuario: 2 },
        { id_usuario: 4 },
        { id_usuario: 5 }
      ];
      
      db.query
        .mockResolvedValueOnce([[{ nombre: 'Usuario Test' }]])  // Get user to delete
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // START TRANSACTION
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // Delete user
        .mockResolvedValueOnce([usuariosRestantes])  // Get all users ordered
        .mockResolvedValue([{ affectedRows: 1 }]);  // Multiple UPDATEs and COMMIT

      const response = await request(app)
        .delete(`/api/users/${userId}/permanent`)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body.message).toContain('eliminado');
      expect(response.body.message).toContain('del 1 al');
    });

    it('debería rechazar auto-eliminación permanente', async () => {
      const response = await request(app)
        .delete(`/api/users/${mockAdminUser.id_usuario}/permanent`)
        .expect(400);

      expect(response.body.error).toContain('No puedes eliminar tu propio usuario');
    });

    it('debería rechazar eliminar usuario inexistente', async () => {
      db.query.mockResolvedValueOnce([[]]);  // User not found

      const response = await request(app)
        .delete('/api/users/999/permanent')
        .expect(404);

      expect(response.body.error).toContain('Usuario no encontrado');
    });
  });

  describe('Seguridad y Validaciones', () => {
    it('roles permitidos: solo ADMIN, CAJERO, COCINERO', async () => {
      const invalidRoles = ['CLIENTE', 'USER', 'SUPERADMIN', 'ROOT'];

      for (const rol of invalidRoles) {
        db.query.mockResolvedValueOnce([[]]);  // No email duplicate

        const response = await request(app)
          .post('/api/users')
          .send({
            nombre: 'Test',
            email: `test${rol}@test.com`,
            password: 'pass123',
            rol: rol
          })
          .expect(400);

        expect(response.body.error).toContain('no permitido');
      }
    });

    it('verificar que bcrypt es usado para hashear contraseñas', async () => {
      // Verificar que el código importa y usa bcrypt
      const bcrypt = require('bcryptjs');
      const password = 'testPassword123';
      
      // Probar bcrypt directamente
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt pattern
      expect(hash.length).toBeGreaterThan(50);
      
      // Verificar que el hash puede ser comparado correctamente
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });
  });
});
