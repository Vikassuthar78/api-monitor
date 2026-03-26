const express = require('express');
const router = express.Router();
const { getSummary, getTrends, getEndpoints } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/trends', protect, getTrends);
router.get('/endpoints', protect, getEndpoints);

module.exports = router;
