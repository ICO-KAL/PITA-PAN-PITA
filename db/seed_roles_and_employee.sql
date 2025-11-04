-- Crear roles si no existen (MySQL)
INSERT INTO Roles (nombre_rol)
SELECT 'CLIENTE'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE nombre_rol = 'CLIENTE');

INSERT INTO Roles (nombre_rol)
SELECT 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE nombre_rol = 'ADMIN');

INSERT INTO Roles (nombre_rol)
SELECT 'GERENTE'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE nombre_rol = 'GERENTE');

INSERT INTO Roles (nombre_rol)
SELECT 'CAJERO'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE nombre_rol = 'CAJERO');

INSERT INTO Roles (nombre_rol)
SELECT 'COCINERO'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE nombre_rol = 'COCINERO');

INSERT INTO Roles (nombre_rol)
SELECT 'MESERO'
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE nombre_rol = 'MESERO');

-- Asignar rol de CAJERO al correo indicado (ejecutar después de crear el usuario vía /register)
UPDATE Usuarios 
SET id_rol = (SELECT id_rol FROM Roles WHERE nombre_rol = 'CAJERO')
WHERE email = 'empleado@pitapanpita.com';
