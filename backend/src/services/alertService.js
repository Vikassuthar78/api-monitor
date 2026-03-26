const nodemailer = require('nodemailer');
const axios = require('axios');
const Alert = require('../models/Alert');

const sendEmail = async (to, subject, text) => {
  if (process.env.EMAIL_ENABLED !== 'true') return;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to, subject, text,
    });
    console.log(`📧 Alert email sent to ${to}`);
  } catch (err) {
    console.error('Email alert error:', err.message);
  }
};

const sendSlack = async (webhookUrl, text) => {
  if (process.env.SLACK_ENABLED !== 'true') return;
  try {
    await axios.post(webhookUrl, { text });
    console.log('💬 Slack alert sent');
  } catch (err) {
    console.error('Slack alert error:', err.message);
  }
};

const checkAndAlert = async (log, user) => {
  const alerts = await Alert.find({ userId: user._id, active: true });
  for (const alert of alerts) {
    const shouldFire = log.isSlowApi && log.responseTimeMs > alert.thresholdMs;
    const failedFire = log.isFailed;
    if (!shouldFire && !failedFire) continue;

    const reason = log.isFailed
      ? `FAILED (status ${log.responseStatus})`
      : `SLOW (${log.responseTimeMs}ms > ${alert.thresholdMs}ms)`;

    const message =
      `🚨 API Alert [${reason}]\n` +
      `URL: ${log.method} ${log.url}\n` +
      `Response Time: ${log.responseTimeMs}ms\n` +
      `Status: ${log.responseStatus}\n` +
      `Time: ${new Date(log.timestamp).toISOString()}`;

    if (alert.type === 'email') {
      await sendEmail(alert.destination, `API Monitor Alert: ${reason}`, message);
    } else if (alert.type === 'slack') {
      await sendSlack(alert.destination, message);
    }
  }
};

module.exports = { checkAndAlert };
