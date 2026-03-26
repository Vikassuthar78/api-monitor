const express = require('express');
const router = express.Router();
const { runTest } = require('../controllers/testController');
const { protect } = require('../middleware/auth');

router.post('/run', protect, runTest);

module.exports = router;
