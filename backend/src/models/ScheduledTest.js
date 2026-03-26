const mongoose = require('mongoose');

const ScheduledTestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    method: { type: String, required: true, uppercase: true },
    url: { type: String, required: true },
    headers: { type: Object, default: {} },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
    queryParams: { type: Object, default: {} },
    cronExpression: { type: String, required: true }, // e.g. "*/5 * * * *"
    runLabel: { type: String, default: '' },
    active: { type: Boolean, default: true },
    lastRun: { type: Date, default: null },
    nextRun: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScheduledTest', ScheduledTestSchema);
