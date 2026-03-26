const axios = require('axios');
const ApiLog = require('../models/ApiLog');
const { checkAndAlert } = require('../services/alertService');

// POST /api/test/run
const runTest = async (req, res, next) => {
  try {
    const { method, url, headers = {}, body, queryParams = {}, runLabel = '' } = req.body;

    if (!method || !url) {
      return res.status(400).json({ success: false, message: 'method and url are required' });
    }

    const startTime = Date.now();
    let responseData = {};
    let responseStatus = 0;
    let responseHeaders = {};
    let errorMessage = '';

    try {
      const axiosConfig = {
        method: method.toLowerCase(),
        url,
        headers: { ...headers },
        params: queryParams,
        timeout: 30000,
        validateStatus: () => true, // don't throw on 4xx/5xx
      };

      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
        axiosConfig.data = body;
      }

      const response = await axios(axiosConfig);
      responseData = response.data;
      responseStatus = response.status;
      responseHeaders = response.headers;
    } catch (err) {
      errorMessage = err.message;
      responseStatus = 0; // network error
    }

    const responseTimeMs = Date.now() - startTime;
    const threshold = parseInt(process.env.SLOW_API_THRESHOLD_MS) || 500;
    const isSlowApi = responseTimeMs > threshold;
    const isFailed = responseStatus >= 400 || responseStatus === 0;

    const log = await ApiLog.create({
      userId: req.user._id,
      runLabel,
      method: method.toUpperCase(),
      url,
      requestHeaders: headers,
      requestBody: body || null,
      queryParams,
      responseStatus,
      responseBody: responseData,
      responseHeaders,
      responseTimeMs,
      isSlowApi,
      isFailed,
      errorMessage,
    });

    // Fire alerts asynchronously
    checkAndAlert(log, req.user).catch((e) => console.error('Alert error:', e));

    res.json({
      success: true,
      log: {
        id: log._id,
        method: log.method,
        url: log.url,
        responseStatus: log.responseStatus,
        responseBody: log.responseBody,
        responseHeaders: log.responseHeaders,
        responseTimeMs: log.responseTimeMs,
        isSlowApi: log.isSlowApi,
        isFailed: log.isFailed,
        errorMessage: log.errorMessage,
        timestamp: log.timestamp,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { runTest };
