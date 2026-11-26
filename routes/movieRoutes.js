const express = require('express');
const movieController = require('../controllers/movieController');

const router = express.Router();

// Comprueba el formato del identificador en todas las rutas que tienen :id.
router.param('id', movieController.validateId);

router.get('/', movieController.listMovies);
router.get('/:id', movieController.getMovie);
router.post('/', movieController.createMovie);
router.patch('/:id', movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router;
