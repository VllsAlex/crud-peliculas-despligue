const express = require('express');
const movieController = require('../controllers/movieController');

const router = express.Router();

router.param('id', movieController.validateId);

router.get('/', movieController.listMovies);
// /new debe ir antes que /:id para que "new" no se interprete como un ID.
router.get('/new', movieController.showNewForm);
router.get('/:id/edit', movieController.showEditForm);
router.get('/:id', movieController.getMovie);

// Los formularios HTML envían POST, también para editar y eliminar.
router.post('/', movieController.createMovie);
router.post('/:id/edit', movieController.updateMovie);
router.post('/:id/delete', movieController.deleteMovie);

module.exports = router;
