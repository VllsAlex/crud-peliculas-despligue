const mongoose = require('mongoose');
const Movie = require('../models/movie');

// Las rutas /web/movies muestran HTML; las rutas /movies devuelven JSON.
function isWeb(req) {
  return req.baseUrl === '/web/movies';
}

function sendError(req, res, status, message) {
  if (isWeb(req)) {
    return res.status(status).render('error.njk', { message });
  }
  return res.status(status).json({ message });
}

// Solo recogemos los campos del modelo, tanto al crear como al actualizar.
function getMovieData(req) {
  const fields = ['title', 'genre', 'director', 'year', 'duration', 'rate', 'poster'];
  const data = {};

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  }

  // En el formulario los géneros se escriben separados por comas.
  if (isWeb(req) && typeof data.genre === 'string') {
    data.genre = data.genre.split(',').map(genre => genre.trim()).filter(Boolean);
  }

  return data;
}

exports.validateId = (req, res, next) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return sendError(req, res, 400, 'Identificador de película incorrecto');
  }
  next();
};

exports.listMovies = async (req, res) => {
  const { genre } = req.query;
  const filter = {};

  if (genre !== undefined && typeof genre !== 'string') {
    return sendError(req, res, 400, 'Género incorrecto');
  }

  if (genre) {
    const escapedGenre = genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.genre = { $regex: `^${escapedGenre}$`, $options: 'i' };
  }

  const movies = await Movie.find(filter);

  if (isWeb(req)) {
    return res.render('movies.njk', { movies, genre });
  }
  res.json(movies);
};

exports.getMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return sendError(req, res, 404, 'Película no encontrada');
  }

  if (isWeb(req)) {
    return res.render('detail.njk', { movie });
  }
  res.json(movie);
};

exports.createMovie = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(req, res, 400, 'Datos de película incorrectos');
  }

  const movie = await Movie.create(getMovieData(req));

  if (isWeb(req)) {
    return res.redirect('/web/movies/' + movie.id);
  }
  res.status(201).json(movie);
};

exports.updateMovie = async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return sendError(req, res, 400, 'Datos de película incorrectos');
  }

  const data = getMovieData(req);
  if (Object.keys(data).length === 0) {
    return sendError(req, res, 400, 'No hay campos válidos para actualizar');
  }

  const movie = await Movie.findByIdAndUpdate(req.params.id, { $set: data }, {
    returnDocument: 'after',
    runValidators: true
  });

  if (!movie) {
    return sendError(req, res, 404, 'Película no encontrada');
  }

  if (isWeb(req)) {
    return res.redirect('/web/movies/' + movie.id);
  }
  res.json(movie);
};

exports.deleteMovie = async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);

  if (!movie) {
    return sendError(req, res, 404, 'Película no encontrada');
  }

  if (isWeb(req)) {
    return res.redirect('/web/movies');
  }
  res.json({ message: 'Película eliminada correctamente' });
};

exports.showNewForm = (req, res) => {
  res.render('form.njk', { movie: {}, editing: false });
};

exports.showEditForm = async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return sendError(req, res, 404, 'Película no encontrada');
  }

  res.render('form.njk', { movie, editing: true });
};
