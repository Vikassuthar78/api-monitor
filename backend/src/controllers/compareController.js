const ApiLog = require('../models/ApiLog');

// GET /api/compare?labels=run1,run2
const compareRuns = async (req, res, next) => {
  try {
    const { labels } = req.query;
    if (!labels) {
      return res.status(400).json({ success: false, message: 'labels query param required (comma-separated)' });
    }
    const labelArr = labels.split(',').map((l) => l.trim()).filter(Boolean);

    const results = await ApiLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          runLabel: { $in: labelArr },
        },
      },
      {
        $group: {
          _id: { label: '$runLabel', method: '$method', url: '$url' },
          avgResponseTime: { $avg: '$responseTimeMs' },
          maxResponseTime: { $max: '$responseTimeMs' },
          minResponseTime: { $min: '$responseTimeMs' },
          count: { $sum: 1 },
          failed: { $sum: { $cond: ['$isFailed', 1, 0] } },
          slowCount: { $sum: { $cond: ['$isSlowApi', 1, 0] } },
        },
      },
      { $sort: { '_id.label': 1, '_id.url': 1 } },
    ]);

    // Group by endpoint for easy comparison
    const grouped = {};
    results.forEach((r) => {
      const key = `${r._id.method} ${r._id.url}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][r._id.label] = {
        avgResponseTime: Math.round(r.avgResponseTime),
        maxResponseTime: r.maxResponseTime,
        minResponseTime: r.minResponseTime,
        count: r.count,
        failed: r.failed,
        slowCount: r.slowCount,
        successRate: r.count > 0 ? (((r.count - r.failed) / r.count) * 100).toFixed(1) : '0',
      };
    });

    res.json({ success: true, labels: labelArr, comparison: grouped });
  } catch (err) {
    next(err);
  }
};

module.exports = { compareRuns };
