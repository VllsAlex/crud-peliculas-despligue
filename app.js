require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const path = require('path');
const movieRoutes = require('./routes/movieRoutes');
const webRoutes = require('./routes/webRoutes');

const app = express();
const port = process.env.PORT || 3000;

nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app
});
app.set('view engine', 'njk');

// JSON para la API y datos de formularios para la web.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.redirect('/web/movies'));
app.use('/movies', movieRoutes);
app.use('/web/movies', webRoutes);

app.use((req, res) => {
  if (req.path === '/movies' || req.path.startsWith('/movies/')) {
    return res.status(404).json({ message: 'Ruta no encontrada' });
  }
  res.status(404).render('error.njk', { message: 'Página no encontrada' });
});

// Express 5 envía aquí también los errores de los controladores async.
app.use((error, req, res, next) => {
  let status = 500;
  let message = 'Error interno del servidor';

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    status = 400;
    message = 'Datos incorrectos. El título es obligatorio y los campos numéricos deben contener números.';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la petición no es un JSON válido';
  }

  if (status === 500) {
    console.error(error.message);
  }

  if (req.path === '/movies' || req.path.startsWith('/movies/')) {
    return res.status(status).json({ message });
  }
  res.status(status).render('error.njk', { message });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('conectado a MongoDB');
    app.listen(port, () => {
      console.log('listening on port ' + port);
    });
  } catch (error) {
    console.error('error connecting to mongodb:', error.message);
    process.exit(1);
  }
}

module.exports = { app, startServer };
