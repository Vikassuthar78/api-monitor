const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['email', 'slack'], required: true },
    destination: { type: String, required: true }, // email address or slack webhook
    thresholdMs: { type: Number, default: 500 },
    active: { type: Boolean, default: true },
    label: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);
