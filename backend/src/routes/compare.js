const express = require('express');
const router = express.Router();
const { compareRuns } = require('../controllers/compareController');
const { protect } = require('../middleware/auth');

router.get('/', protect, compareRuns);

module.exports = router;
