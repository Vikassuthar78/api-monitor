const ApiLog = require('../models/ApiLog');

// GET /api/analytics/summary
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { userId: req.user._id };
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const [result] = await ApiLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: { $sum: { $cond: ['$isFailed', 0, 1] } },
          failed: { $sum: { $cond: ['$isFailed', 1, 0] } },
          slowCount: { $sum: { $cond: ['$isSlowApi', 1, 0] } },
          avgResponseTime: { $avg: '$responseTimeMs' },
          maxResponseTime: { $max: '$responseTimeMs' },
          minResponseTime: { $min: '$responseTimeMs' },
        },
      },
    ]);

    res.json({
      success: true,
      summary: result || {
        total: 0, success: 0, failed: 0, slowCount: 0,
        avgResponseTime: 0, maxResponseTime: 0, minResponseTime: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/trends  — hourly/daily buckets
const getTrends = async (req, res, next) => {
  try {
    const { startDate, endDate, bucket = 'hour' } = req.query;
    const match = { userId: req.user._id };
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const dateFormat = bucket === 'day' ? '%Y-%m-%d' : '%Y-%m-%dT%H:00';

    const trends = await ApiLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
          avgResponseTime: { $avg: '$responseTimeMs' },
          maxResponseTime: { $max: '$responseTimeMs' },
          count: { $sum: 1 },
          failed: { $sum: { $cond: ['$isFailed', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 200 },
    ]);

    res.json({ success: true, trends });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/endpoints
const getEndpoints = async (req, res, next) => {
  try {
    const match = { userId: req.user._id };
    const { startDate, endDate } = req.query;
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = new Date(startDate);
      if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    const endpoints = await ApiLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { method: '$method', url: '$url' },
          avgResponseTime: { $avg: '$responseTimeMs' },
          count: { $sum: 1 },
          failed: { $sum: { $cond: ['$isFailed', 1, 0] } },
          slowCount: { $sum: { $cond: ['$isSlowApi', 1, 0] } },
        },
      },
      { $sort: { avgResponseTime: -1 } },
      { $limit: 50 },
    ]);

    res.json({ success: true, endpoints });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getTrends, getEndpoints };
