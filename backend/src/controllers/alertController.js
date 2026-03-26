const Alert = require('../models/Alert');

// POST /api/alerts
const create = async (req, res, next) => {
  try {
    const { type, destination, thresholdMs, label } = req.body;
    if (!type || !destination) {
      return res.status(400).json({ success: false, message: 'type and destination required' });
    }
    const alert = await Alert.create({ userId: req.user._id, type, destination, thresholdMs: thresholdMs || 500, label: label || '' });
    res.status(201).json({ success: true, alert });
  } catch (err) { next(err); }
};

// GET /api/alerts
const list = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (err) { next(err); }
};

// PUT /api/alerts/:id
const update = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, alert });
  } catch (err) { next(err); }
};

// DELETE /api/alerts/:id
const remove = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!alert) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
};

module.exports = { create, list, update, remove };
