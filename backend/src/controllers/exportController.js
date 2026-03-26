const ApiLog = require('../models/ApiLog');
const PDFDocument = require('pdfkit');

// GET /api/export/csv
const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, url, method } = req.query;
    const filter = { userId: req.user._id };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (url) filter.url = { $regex: url, $options: 'i' };
    if (method) filter.method = method.toUpperCase();

    const logs = await ApiLog.find(filter).sort({ timestamp: -1 }).limit(5000).lean();

    const rows = logs.map((l) => ({
      id: l._id.toString(),
      timestamp: new Date(l.timestamp).toISOString(),
      method: l.method,
      url: l.url,
      status: l.responseStatus,
      responseTimeMs: l.responseTimeMs,
      isSlowApi: l.isSlowApi,
      isFailed: l.isFailed,
      runLabel: l.runLabel,
    }));

    const headers = ['id', 'timestamp', 'method', 'url', 'status', 'responseTimeMs', 'isSlowApi', 'isFailed', 'runLabel'];
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename="api_logs.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// GET /api/export/pdf
const exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await ApiLog.find(filter).sort({ timestamp: -1 }).limit(200).lean();

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Disposition', 'attachment; filename="api_report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(20).text('API Monitor Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(2);

    logs.forEach((l, i) => {
      doc.fontSize(9).text(
        `${i + 1}. [${new Date(l.timestamp).toLocaleString()}] ${l.method} ${l.url} — Status: ${l.responseStatus} — ${l.responseTimeMs}ms${l.isSlowApi ? ' ⚠ SLOW' : ''}${l.isFailed ? ' ✗ FAILED' : ''}`
      );
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = { exportCSV, exportPDF };
