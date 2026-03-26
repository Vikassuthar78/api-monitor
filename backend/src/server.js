require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await initCronJobs();
  app.listen(PORT, () => {
    console.log(`🚀 API Monitor backend running on http://localhost:${PORT}`);
    console.log(`📖 Swagger docs: http://localhost:${PORT}/api-docs`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
