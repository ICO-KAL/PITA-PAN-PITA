# Backen (Backend) - PITA PAN

Este directorio contiene el backend Node.js para la aplicación de gestión de restaurantes.

Pasos rápidos:

1. Ir a `backen`:
   ```powershell
   cd backen
   ```
2. Instalar dependencias:
   ```powershell
   npm install
   ```
3. Crear `.env` a partir de `.env.example` y rellenar las credenciales de la base de datos.
4. Importar la base de datos (usa `db/PintaPunPita.sql` que ya está en el repo):
   ```powershell
   npm run import-db
   ```
5. Iniciar el servidor:
   ```powershell
   npm run dev
   ```

Archivos principales:
- `src/index.js` - servidor Express.
- `src/db.js` - módulo de conexión a MySQL (mysql2/promise).
- `src/routes/restaurants.js` - rutas CRUD de ejemplo para la tabla `restaurants`.
- `scripts/importSql.js` - script que importa `db/PintaPunPita.sql` en la base de datos.

Notas de seguridad:
- No comitees tu `.env` real con contraseñas. Usa variables de entorno en producción.
