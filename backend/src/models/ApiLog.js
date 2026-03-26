const mongoose = require('mongoose');

const ApiLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    runLabel: { type: String, default: '' }, // for comparison engine
    method: { type: String, required: true, uppercase: true },
    url: { type: String, required: true },
    requestHeaders: { type: Object, default: {} },
    requestBody: { type: mongoose.Schema.Types.Mixed, default: null },
    queryParams: { type: Object, default: {} },
    responseStatus: { type: Number },
    responseBody: { type: mongoose.Schema.Types.Mixed },
    responseHeaders: { type: Object, default: {} },
    responseTimeMs: { type: Number, default: 0 },
    isSlowApi: { type: Boolean, default: false },
    isFailed: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for fast filtering
ApiLogSchema.index({ userId: 1, timestamp: -1 });
ApiLogSchema.index({ url: 1 });
ApiLogSchema.index({ runLabel: 1 });

module.exports = mongoose.model('ApiLog', ApiLogSchema);
