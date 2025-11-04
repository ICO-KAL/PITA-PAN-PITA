const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const restaurantsRouter = require('./routes/restaurants');
const authRouter = require('./routes/auth');
const healthRouter = require('./routes/health');
const categoriasRouter = require('./routes/categorias');
const pedidosRouter = require('./routes/pedidos');
const seguimientoRouter = require('./routes/seguimiento');
const notificacionesRouter = require('./routes/notificaciones');
const pagosRouter = require('./routes/pagos');
const usersRouter = require('./routes/users');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/seguimiento', seguimientoRouter);
app.use('/api/notificaciones', notificacionesRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/users', usersRouter);
app.use('/api/health', healthRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
