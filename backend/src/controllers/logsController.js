const ApiLog = require('../models/ApiLog');

// GET /api/logs
const getLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, url, method, page = 1, limit = 20, isFailed, isSlowApi } = req.query;

    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (url) filter.url = { $regex: url, $options: 'i' };
    if (method) filter.method = method.toUpperCase();
    if (isFailed !== undefined) filter.isFailed = isFailed === 'true';
    if (isSlowApi !== undefined) filter.isSlowApi = isSlowApi === 'true';

    const total = await ApiLog.countDocuments(filter);
    const logs = await ApiLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      logs,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/logs/:id
const getLog = async (req, res, next) => {
  try {
    const log = await ApiLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/logs/:id
const deleteLog = async (req, res, next) => {
  try {
    const log = await ApiLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/logs  (clear all of user's logs)
const clearLogs = async (req, res, next) => {
  try {
    await ApiLog.deleteMany({ userId: req.user._id });
    res.json({ success: true, message: 'All logs cleared' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs, getLog, deleteLog, clearLogs };
