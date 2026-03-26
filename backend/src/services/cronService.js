const cron = require('node-cron');
const axios = require('axios');
const ApiLog = require('../models/ApiLog');
const ScheduledTest = require('../models/ScheduledTest');
const { checkAndAlert } = require('./alertService');

const jobs = {}; // jobId -> cron.Task

const executeTest = async (test, user) => {
  const startTime = Date.now();
  let responseData = {};
  let responseStatus = 0;
  let responseHeaders = {};
  let errorMessage = '';

  try {
    const axiosConfig = {
      method: test.method.toLowerCase(),
      url: test.url,
      headers: test.headers || {},
      params: test.queryParams || {},
      timeout: 30000,
      validateStatus: () => true,
    };
    if (['post', 'put', 'patch'].includes(test.method.toLowerCase()) && test.body) {
      axiosConfig.data = test.body;
    }
    const response = await axios(axiosConfig);
    responseData = response.data;
    responseStatus = response.status;
    responseHeaders = response.headers;
  } catch (err) {
    errorMessage = err.message;
  }

  const responseTimeMs = Date.now() - startTime;
  const threshold = parseInt(process.env.SLOW_API_THRESHOLD_MS) || 500;
  const isSlowApi = responseTimeMs > threshold;
  const isFailed = responseStatus >= 400 || responseStatus === 0;

  const log = await ApiLog.create({
    userId: test.userId,
    runLabel: test.runLabel || test.name,
    method: test.method,
    url: test.url,
    requestHeaders: test.headers,
    requestBody: test.body,
    queryParams: test.queryParams,
    responseStatus,
    responseBody: responseData,
    responseHeaders,
    responseTimeMs,
    isSlowApi,
    isFailed,
    errorMessage,
  });

  await ScheduledTest.findByIdAndUpdate(test._id, { lastRun: new Date() });
  if (user) checkAndAlert(log, user).catch(console.error);
  console.log(`⏰ Scheduled test "${test.name}" ran — ${responseStatus} in ${responseTimeMs}ms`);
};

const registerJob = (test, user) => {
  if (!cron.validate(test.cronExpression)) {
    console.warn(`⚠️ Invalid cron expression for "${test.name}": ${test.cronExpression}`);
    return;
  }
  const jobId = test._id.toString();
  if (jobs[jobId]) jobs[jobId].stop();

  jobs[jobId] = cron.schedule(test.cronExpression, () => {
    executeTest(test, user).catch(console.error);
  });
  console.log(`✅ Cron job registered: "${test.name}" (${test.cronExpression})`);
};

const removeJob = (jobId) => {
  if (jobs[jobId]) {
    jobs[jobId].stop();
    delete jobs[jobId];
  }
};

// Boot: load all active jobs from DB
const initCronJobs = async () => {
  try {
    const tests = await ScheduledTest.find({ active: true });
    for (const test of tests) {
      registerJob(test, null); // user not available at boot; alerts may not fire
    }
    console.log(`✅ Initialized ${tests.length} cron job(s)`);
  } catch (err) {
    console.error('Cron init error:', err.message);
  }
};

module.exports = { registerJob, removeJob, initCronJobs };
