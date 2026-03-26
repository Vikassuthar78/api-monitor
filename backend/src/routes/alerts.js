const express = require('express');
const router = express.Router();
const { create, list, update, remove } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.post('/', protect, create);
router.get('/', protect, list);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
