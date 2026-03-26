const express = require('express');
const router = express.Router();
const { getLogs, getLog, deleteLog, clearLogs } = require('../controllers/logsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getLogs);
router.get('/:id', protect, getLog);
router.delete('/clear/all', protect, clearLogs);
router.delete('/:id', protect, deleteLog);

module.exports = router;
