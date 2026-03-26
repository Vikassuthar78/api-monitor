const ScheduledTest = require('../models/ScheduledTest');
const { registerJob, removeJob } = require('../services/cronService');

// POST /api/scheduler
const create = async (req, res, next) => {
  try {
    const { name, method, url, headers, body, queryParams, cronExpression, runLabel } = req.body;
    if (!name || !method || !url || !cronExpression) {
      return res.status(400).json({ success: false, message: 'name, method, url, cronExpression are required' });
    }

    const test = await ScheduledTest.create({
      userId: req.user._id, name, method: method.toUpperCase(), url,
      headers: headers || {}, body: body || null,
      queryParams: queryParams || {}, cronExpression,
      runLabel: runLabel || name,
    });

    registerJob(test, req.user);
    res.status(201).json({ success: true, test });
  } catch (err) {
    next(err);
  }
};

// GET /api/scheduler
const list = async (req, res, next) => {
  try {
    const tests = await ScheduledTest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (err) {
    next(err);
  }
};

// PUT /api/scheduler/:id
const update = async (req, res, next) => {
  try {
    const test = await ScheduledTest.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!test) return res.status(404).json({ success: false, message: 'Not found' });
    removeJob(test._id.toString());
    if (test.active) registerJob(test, req.user);
    res.json({ success: true, test });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/scheduler/:id
const remove = async (req, res, next) => {
  try {
    const test = await ScheduledTest.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!test) return res.status(404).json({ success: false, message: 'Not found' });
    removeJob(test._id.toString());
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, update, remove };
